import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native';

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
export const FASHION_HOME_HERO_TOP_GLOW = 'rgba(244, 214, 144, 0.1)';
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
export const FASHION_HOME_WEB_WORLD_CARD_ROW_ESTIMATE_PX = 180;
/** @deprecated Use `FASHION_HOME_WEB_OPENING_STAGE_CARD_ROW_BOTTOM_CLEARANCE_PX`. */
export const FASHION_HOME_WEB_OPENING_STAGE_WORLD_STRIP_BOTTOM_INSET_PX = 10;
/** Gap between hero bottom edge and world-card row top (px). */
export const FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX = 6;
/** Opening hero height floor / cap (px) — viewport-capped; cards must not clip. */
export const FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX = 430;
export const FASHION_HOME_WEB_OPENING_STAGE_HERO_MAX_PX = 494;
/**
 * Opening-stage bleed budget (desktop web) — used for hub margin breakout only.
 * Stage hero/cards use `VIEWPORT_RIGHT_INSET_PX` inside a viewport-contained rail.
 */
export const FASHION_HOME_WEB_OPENING_STAGE_STAGE_RIGHT_BLEED_PX = 212;
/** Visible inset from viewport right for hero + world cards (1366 → right ≈ 1352). */
export const FASHION_HOME_WEB_OPENING_STAGE_VIEWPORT_RIGHT_INSET_PX = 14;
/** Opening-stage world card cell min height (host only; card component unchanged). */
export const FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_MIN_HEIGHT_PX = 180;
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
export const FASHION_HOME_WEB_OPENING_STAGE_HUB_PULLUP_PX = 18;
/** TRUE_COMPACT_LAYOUT — fullscreen opening-stage vertical contract (web fashion home). */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_COMPACT_GRID_TOP_PX = 5;
/** DOCK.FINAL.NUDGE — extra viewport budget trim so cards + dock sit higher (fullscreen). */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_NUDGE_VIEWPORT_PX = 0;
/** BOTTOM_DOCK.FIT — trim on rendered hero frame (fullscreen only). */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_HERO_TRIM_PX = 0;
/** PREMIUM_VERTICAL_LOCK — extra hero budget after dock-fit clamp (fullscreen only). */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_HERO_HEIGHT_BONUS_PX = 11;
/** PREMIUM_VERTICAL_LOCK — rendered hero frame extend below compute height (fullscreen only). */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_PREMIUM_HERO_FRAME_EXTEND_PX = 14;
/** BOTTOM_DOCK.FIT — hero→card margin in normal flow (fullscreen only). */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_CARD_GAP_PX = 4;
/** BOTTOM_DOCK.FIT — card row→action dock margin (fullscreen only). */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_DOCK_GAP_PX = 6;
/** BOTTOM_DOCK.FIT — measured quick-action dock height at 1366×768 (two grid rows). */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_PANEL_ESTIMATE_PX = 104;
/** PREMIUM_VERTICAL_LOCK — dock bottom breathing inside viewport (fullscreen). */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_VIEWPORT_BOTTOM_AIR_PX = 6;
/**
 * BOTTOM_DOCK.FIT — floor when chrome measure lags in fullscreen (scroll offset to stage).
 * Prevents opening stage from consuming space the dock needs below the card row.
 */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_CHROME_FLOOR_PX = 72;
/** BOTTOM_DOCK.FIT — reserve two pill rows + gap in viewport budget (title hidden). */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_RESERVE_PX = 124;
/** @deprecated Use `FULLSCREEN_DOCK_FIT_HERO_TRIM_PX`. */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_COMPACT_HERO_HEIGHT_TRIM_PX =
  FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_HERO_TRIM_PX;
/** @deprecated Use `FULLSCREEN_DOCK_FIT_DOCK_GAP_PX`. */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_COMPACT_DOCK_GAP_PX =
  FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_DOCK_GAP_PX;
/** @deprecated Use `FULLSCREEN_COMPACT_GRID_TOP_PX`. */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_HERO_TOP_OFFSET_PX =
  FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_COMPACT_GRID_TOP_PX;
/** @deprecated Use `FULLSCREEN_COMPACT_HERO_HEIGHT_TRIM_PX`. */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_HERO_REDUCE_PX =
  FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_COMPACT_HERO_HEIGHT_TRIM_PX;
/** @deprecated Negative card lift removed — use normal 6px hero→card gap in fullscreen. */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_CARD_LIFT_PX = 0;
/** @deprecated Use `FULLSCREEN_COMPACT_DOCK_GAP_PX`. */
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_GAP_PX =
  FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_COMPACT_DOCK_GAP_PX;
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_ACTION_DOCK_GAP_PX =
  FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_COMPACT_DOCK_GAP_PX;
export const FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_HUB_GAP_PX =
  FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_COMPACT_DOCK_GAP_PX;
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
/** GLASS.HOME.PREMIUM.LIGHTING.1 — richer edge-lit glass; less milky veil on hero/cards. */
/** GLASS.HOME.3 — snappier glass hover (within 160–220ms). */
export const FASHION_HOME_DAYLIGHT_TRANSITION_MS = 200;

/** Slightly lifted canvas vs `fashionTech.canvas`; still deep navy. */
export const FASHION_HOME_DAYLIGHT_CANVAS = 'rgb(13, 18, 28)';
export const FASHION_HOME_DAYLIGHT_CANVAS_ELEVATED = 'rgb(16, 24, 38)';

/** Native fallback — wide dissolve before center (web uses radial scrim). */
export const FASHION_HOME_DAYLIGHT_HERO_SCRIM_LEFT = [
  'rgba(4, 7, 12, 0.32)',
  'rgba(4, 7, 12, 0.14)',
  'rgba(4, 7, 12, 0.05)',
  'rgba(4, 7, 12, 0.015)',
  'rgba(4, 7, 12, 0)',
] as const;

/** @deprecated Daylight hero omits full-surface vignette (causes horizontal banding). */
export const FASHION_HOME_DAYLIGHT_HERO_VIGNETTE = [
  'rgba(0, 0, 0, 0)',
  'rgba(0, 0, 0, 0)',
  'rgba(0, 0, 0, 0)',
] as const;

/** @deprecated Removed from hero stack — full-surface luminous wash. */
export const FASHION_HOME_DAYLIGHT_HERO_LUMINOUS = [
  'rgba(255, 232, 198, 0)',
  'rgba(255, 244, 228, 0)',
  'rgba(236, 220, 200, 0)',
] as const;

/** @deprecated Removed from hero stack — full-surface lift wash. */
export const FASHION_HOME_DAYLIGHT_HERO_LIFT_OVERLAY = [
  'rgba(255, 248, 238, 0)',
  'rgba(248, 240, 228, 0)',
  'rgba(255, 238, 210, 0)',
] as const;

/** @deprecated Removed from hero stack — large diagonal band. */
export const FASHION_HOME_DAYLIGHT_HERO_REFRACTION_DIAGONAL = [
  'rgba(170, 232, 255, 0)',
  'rgba(238, 206, 128, 0)',
  'rgba(170, 232, 255, 0)',
] as const;

/** GLASS.HOME.PREMIUM.2 — champagne primary rim; cyan only as micro glass-tech accent. */
export const FASHION_HOME_DAYLIGHT_FRAME_BORDER = 'rgba(252, 236, 200, 0.48)';
export const FASHION_HOME_DAYLIGHT_FRAME_GLOW = 'rgba(252, 228, 168, 0.022)';

/** 1px top hairline — specular catch, not a thick band. */
export const FASHION_HOME_DAYLIGHT_HERO_TOP_EDGE = 'rgba(255, 242, 215, 0.27)';

/** Tiny hero corner glint — top-left (warm). */
export const FASHION_HOME_DAYLIGHT_HERO_CORNER_GLINT: readonly [string, string] = [
  'rgba(252, 228, 168, 0.037)',
  'rgba(252, 228, 168, 0)',
];

/** Tiny hero corner glint — top-right (cool accent). */
export const FASHION_HOME_DAYLIGHT_HERO_CORNER_GLINT_TR: readonly [string, string] = [
  'rgba(148, 210, 255, 0.032)',
  'rgba(148, 210, 255, 0)',
];

/** Outer hero micro glow — tight dual halos (champagne + cyan glass-tech). */
const FASHION_HOME_DAYLIGHT_HERO_EDGE_GLOW =
  '0 0 2px rgba(252, 228, 168, 0.1), 0 0 4px rgba(252, 228, 168, 0.132), 0 0 2px rgba(148, 210, 255, 0.09), 0 0 3px rgba(148, 210, 255, 0.088)';

const FASHION_HOME_DAYLIGHT_HERO_INNER_RIM = 'inset 0 0 0 1px rgba(252, 232, 190, 0.22)';
const FASHION_HOME_DAYLIGHT_HERO_INNER_HIGHLIGHT = 'inset 0 1px 0 rgba(255, 248, 235, 0.042)';

/** Hero side accent lines — 1px geometry only. */
export const FASHION_HOME_DAYLIGHT_HERO_CYAN_EDGE = 'rgba(148, 210, 255, 0.32)';

const FASHION_HOME_GLASS_DEPTH_SHADOW = '0 2px 10px rgba(4, 8, 12, 0.2)';

function fashionHomeGlassBoxShadow(layers: string[]): string {
  return layers.filter(Boolean).join(', ');
}

export const FASHION_HOME_DAYLIGHT_RAIL_GRADIENT = [
  'rgba(12, 18, 30, 0.96)',
  'rgba(11, 17, 28, 0.93)',
  'rgba(12, 18, 30, 0.95)',
] as const;
export const FASHION_HOME_DAYLIGHT_RAIL_BORDER = 'rgba(252, 236, 200, 0.42)';
export const FASHION_HOME_DAYLIGHT_RAIL_HIGHLIGHT = 'rgba(255, 238, 200, 0.16)';

export const FASHION_HOME_DAYLIGHT_HEADLINE = '#ffffff';
export const FASHION_HOME_DAYLIGHT_TEXT_SHADOW = 'rgba(2, 5, 10, 0.32)';
export const FASHION_HOME_DAYLIGHT_SUBTITLE = 'rgba(252, 253, 255, 0.96)';
export const FASHION_HOME_DAYLIGHT_EYEBROW = 'rgba(255, 240, 210, 1)';

/** Legacy neutral card wrapper tint (prefer semantic `fashionHomeDaylightWorldCardNativeShellStyle`). */
export const FASHION_HOME_DAYLIGHT_CARD_FILL = 'rgba(255, 250, 238, 0.035)';

/** Small contained rim for chips / compact glass (not world-card outer bloom). */
export const FASHION_HOME_DAYLIGHT_CHIP_CONTAINED_GLOW = 'rgba(252, 228, 196, 0.34)';

/** World-card daylight accent — drives semantic glass material on wrappers. */
export type FashionHomeWorldCardDaylightAccent = 'local' | 'travel' | 'academy' | 'business';

const FASHION_HOME_DAYLIGHT_WORLD_EDGE_GLOW: Record<FashionHomeWorldCardDaylightAccent, string> = {
  local: '0 0 3px rgba(72, 210, 165, 0.11)',
  travel: '0 0 3px rgba(92, 205, 255, 0.11)',
  academy: '0 0 3px rgba(178, 132, 248, 0.078)',
  business: '0 0 3px rgba(228, 192, 110, 0.126)',
};

const FASHION_HOME_DAYLIGHT_WORLD_WEB_RIM: Record<FashionHomeWorldCardDaylightAccent, string> = {
  local: 'rgba(72, 210, 165, 0.8)',
  travel: 'rgba(92, 205, 255, 0.8)',
  academy: 'rgba(178, 132, 248, 0.69)',
  business: 'rgba(228, 192, 110, 0.91)',
};

const FASHION_HOME_DAYLIGHT_WORLD_INNER_HIGHLIGHT: Record<FashionHomeWorldCardDaylightAccent, string> = {
  local: 'inset 0 0 0 1px rgba(120, 235, 198, 0.16)',
  travel: 'inset 0 0 0 1px rgba(140, 215, 255, 0.16)',
  academy: 'inset 0 0 0 1px rgba(200, 165, 255, 0.13)',
  business: 'inset 0 0 0 1px rgba(255, 215, 150, 0.185)',
};

const FASHION_HOME_DAYLIGHT_WORLD_INNER_DEPTH = 'inset 0 -2px 8px rgba(0, 0, 0, 0.17)';

/** GLASS.HOME.PREMIUM.2 — thin rim + inner highlight + micro glow + depth (no surface wash). */
const FASHION_HOME_DAYLIGHT_WORLD_WEB_MATERIAL: Record<FashionHomeWorldCardDaylightAccent, string> = {
  local: fashionHomeGlassBoxShadow([
    `0 0 0 1px ${FASHION_HOME_DAYLIGHT_WORLD_WEB_RIM.local}`,
    FASHION_HOME_DAYLIGHT_WORLD_EDGE_GLOW.local,
    FASHION_HOME_DAYLIGHT_WORLD_INNER_HIGHLIGHT.local,
    FASHION_HOME_DAYLIGHT_WORLD_INNER_DEPTH,
    FASHION_HOME_GLASS_DEPTH_SHADOW,
  ]),
  travel: fashionHomeGlassBoxShadow([
    `0 0 0 1px ${FASHION_HOME_DAYLIGHT_WORLD_WEB_RIM.travel}`,
    FASHION_HOME_DAYLIGHT_WORLD_EDGE_GLOW.travel,
    FASHION_HOME_DAYLIGHT_WORLD_INNER_HIGHLIGHT.travel,
    FASHION_HOME_DAYLIGHT_WORLD_INNER_DEPTH,
    FASHION_HOME_GLASS_DEPTH_SHADOW,
  ]),
  academy: fashionHomeGlassBoxShadow([
    `0 0 0 1px ${FASHION_HOME_DAYLIGHT_WORLD_WEB_RIM.academy}`,
    FASHION_HOME_DAYLIGHT_WORLD_EDGE_GLOW.academy,
    FASHION_HOME_DAYLIGHT_WORLD_INNER_HIGHLIGHT.academy,
    FASHION_HOME_DAYLIGHT_WORLD_INNER_DEPTH,
    FASHION_HOME_GLASS_DEPTH_SHADOW,
  ]),
  business: fashionHomeGlassBoxShadow([
    `0 0 0 1px ${FASHION_HOME_DAYLIGHT_WORLD_WEB_RIM.business}`,
    FASHION_HOME_DAYLIGHT_WORLD_EDGE_GLOW.business,
    FASHION_HOME_DAYLIGHT_WORLD_INNER_HIGHLIGHT.business,
    FASHION_HOME_DAYLIGHT_WORLD_INNER_DEPTH,
    '0 2px 10px rgba(4, 8, 12, 0.18)',
  ]),
};

const FASHION_HOME_DAYLIGHT_WORLD_NATIVE: Record<
  FashionHomeWorldCardDaylightAccent,
  Readonly<{ fill: string; rim: string; shadowRadius: number; elevation: number }>
> = {
  local: { fill: 'rgba(48, 175, 138, 0.019)', rim: 'rgba(58, 190, 150, 0.48)', shadowRadius: 8, elevation: 2 },
  travel: { fill: 'rgba(72, 168, 228, 0.019)', rim: 'rgba(78, 175, 238, 0.48)', shadowRadius: 8, elevation: 2 },
  academy: { fill: 'rgba(138, 108, 218, 0.021)', rim: 'rgba(160, 120, 235, 0.48)', shadowRadius: 8, elevation: 2 },
  business: { fill: 'rgba(210, 172, 92, 0.018)', rim: 'rgba(205, 168, 88, 0.52)', shadowRadius: 8, elevation: 2 },
};

/** Narrow top sheen — specular edge only. */
/** GLASS.HOME.ROOT — top-edge only; Home glass stack omits when edge-lit card mode is active. */
export const FASHION_HOME_DAYLIGHT_WORLD_SURFACE_SHEEN: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string]
> = {
  local: ['rgba(255, 255, 255, 0.009)', 'rgba(120, 220, 188, 0.018)', 'rgba(255, 255, 255, 0)'],
  travel: ['rgba(255, 255, 255, 0.009)', 'rgba(130, 210, 255, 0.018)', 'rgba(255, 255, 255, 0)'],
  academy: ['rgba(255, 255, 255, 0.007)', 'rgba(200, 165, 255, 0.014)', 'rgba(255, 255, 255, 0)'],
  business: ['rgba(255, 248, 232, 0.009)', 'rgba(230, 195, 120, 0.017)', 'rgba(255, 255, 255, 0)'],
};

/** GLASS.HOME.FINAL — minimal horizontal tint; no milk across the photo. */
export const FASHION_HOME_DAYLIGHT_WORLD_FROST_FIELD: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string, string]
> = {
  local: [
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.006)',
    'rgba(52, 175, 140, 0.036)',
    'rgba(24, 72, 58, 0.058)',
  ],
  travel: [
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.007)',
    'rgba(70, 168, 228, 0.038)',
    'rgba(22, 58, 92, 0.064)',
  ],
  academy: [
    'rgba(255, 255, 255, 0)',
    'rgba(255, 255, 255, 0.005)',
    'rgba(145, 112, 220, 0.035)',
    'rgba(40, 28, 72, 0.068)',
  ],
  business: [
    'rgba(255, 248, 232, 0)',
    'rgba(255, 248, 232, 0.006)',
    'rgba(210, 168, 88, 0.033)',
    'rgba(72, 48, 22, 0.053)',
  ],
};

/** @deprecated Omitted from card stack — diagonal sheets read as bands on photos. */
export const FASHION_HOME_DAYLIGHT_WORLD_DIAGONAL_SPECULAR: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string]
> = {
  local: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(120, 235, 198, 0)'],
  travel: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(140, 210, 255, 0)'],
  academy: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(220, 175, 255, 0)'],
  business: ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0)', 'rgba(240, 200, 120, 0)'],
};

/** Contained semantic glow — icon/title pocket only (used with small layout box in Home). */
export const FASHION_HOME_DAYLIGHT_WORLD_MATERIAL_GLOW: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string]
> = {
  local: ['rgba(72, 210, 170, 0.08)', 'rgba(52, 175, 140, 0.018)', 'rgba(72, 205, 165, 0)'],
  travel: ['rgba(100, 200, 255, 0.08)', 'rgba(70, 168, 228, 0.018)', 'rgba(95, 195, 248, 0)'],
  academy: ['rgba(195, 155, 255, 0.074)', 'rgba(140, 110, 220, 0.016)', 'rgba(175, 145, 248, 0)'],
  business: ['rgba(235, 198, 120, 0.076)', 'rgba(210, 168, 88, 0.019)', 'rgba(235, 200, 120, 0)'],
};

/** Bottom veil — dark footer only; stays off the photo body. */
export const FASHION_HOME_DAYLIGHT_WORLD_BOTTOM_VEIL: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string]
> = {
  local: ['rgba(10, 28, 22, 0)', 'rgba(12, 36, 28, 0.32)'],
  travel: ['rgba(10, 22, 34, 0)', 'rgba(12, 32, 52, 0.32)'],
  academy: ['rgba(18, 12, 32, 0)', 'rgba(22, 16, 40, 0.34)'],
  business: ['rgba(28, 20, 10, 0)', 'rgba(36, 24, 12, 0.29)'],
};

/** 1px top edge hairline (replaces wide refraction band gradient). */
export const FASHION_HOME_DAYLIGHT_WORLD_TOP_EDGE_LINE: Record<FashionHomeWorldCardDaylightAccent, string> = {
  local: 'rgba(120, 235, 198, 0.5)',
  travel: 'rgba(140, 215, 255, 0.5)',
  academy: 'rgba(200, 165, 255, 0.41)',
  business: 'rgba(255, 215, 150, 0.58)',
};

/** @deprecated Use `FASHION_HOME_DAYLIGHT_WORLD_TOP_EDGE_LINE` + 1px View. */
export const FASHION_HOME_DAYLIGHT_WORLD_TOP_REFRACTION_BAND: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string]
> = {
  local: ['rgba(210, 255, 238, 0)', 'rgba(210, 255, 238, 0)', 'rgba(210, 255, 238, 0)'],
  travel: ['rgba(210, 244, 255, 0)', 'rgba(210, 244, 255, 0)', 'rgba(210, 244, 255, 0)'],
  academy: ['rgba(235, 210, 255, 0)', 'rgba(235, 210, 255, 0)', 'rgba(235, 210, 255, 0)'],
  business: ['rgba(255, 236, 200, 0)', 'rgba(255, 236, 200, 0)', 'rgba(255, 236, 200, 0)'],
};

/** GLASS.HOME.FINAL — edge soften optional; kept near-zero (Home may omit layer). */
export const FASHION_HOME_DAYLIGHT_WORLD_EDGE_SOFTEN: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string]
> = {
  local: ['rgba(255, 255, 255, 0.005)', 'rgba(8, 12, 18, 0)'],
  travel: ['rgba(255, 255, 255, 0.005)', 'rgba(8, 12, 18, 0)'],
  academy: ['rgba(255, 255, 255, 0.005)', 'rgba(8, 12, 18, 0)'],
  business: ['rgba(255, 248, 230, 0.006)', 'rgba(8, 12, 18, 0)'],
};

/** Tiny top-left corner glint only (not a horizontal band). */
export const FASHION_HOME_DAYLIGHT_WORLD_CORNER_LIT_TL: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string]
> = {
  local: ['rgba(120, 235, 198, 0.044)', 'rgba(72, 205, 165, 0)'],
  travel: ['rgba(140, 215, 255, 0.044)', 'rgba(70, 168, 228, 0)'],
  academy: ['rgba(200, 165, 255, 0.033)', 'rgba(168, 138, 238, 0)'],
  business: ['rgba(255, 215, 150, 0.052)', 'rgba(228, 192, 110, 0)'],
};

/** @deprecated Omitted from card stack. */
export const FASHION_HOME_DAYLIGHT_WORLD_CORNER_LIT_TR: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string]
> = {
  local: ['rgba(120, 235, 198, 0)', 'rgba(52, 175, 140, 0)'],
  travel: ['rgba(140, 215, 255, 0)', 'rgba(70, 168, 228, 0)'],
  academy: ['rgba(220, 175, 255, 0)', 'rgba(145, 112, 220, 0)'],
  business: ['rgba(255, 215, 150, 0)', 'rgba(210, 168, 88, 0)'],
};

/** @deprecated Omitted — mid-card sweep reads as a horizontal band on hover. */
export const FASHION_HOME_DAYLIGHT_WORLD_HOVER_EDGE_SWEEP: Record<
  FashionHomeWorldCardDaylightAccent,
  readonly [string, string, string]
> = {
  local: ['rgba(72, 205, 165, 0)', 'rgba(120, 235, 200, 0)', 'rgba(72, 205, 165, 0)'],
  travel: ['rgba(70, 168, 228, 0)', 'rgba(140, 215, 255, 0)', 'rgba(70, 168, 228, 0)'],
  academy: ['rgba(168, 138, 238, 0)', 'rgba(220, 175, 255, 0)', 'rgba(168, 138, 238, 0)'],
  business: ['rgba(228, 192, 110, 0)', 'rgba(255, 215, 150, 0)', 'rgba(228, 192, 110, 0)'],
};

const FASHION_HOME_DAYLIGHT_WORLD_HOVER_EDGE_GLOW: Record<FashionHomeWorldCardDaylightAccent, string> = {
  local: ', 0 0 4px rgba(72, 210, 165, 0.13)',
  travel: ', 0 0 4px rgba(92, 205, 255, 0.13)',
  academy: ', 0 0 4px rgba(178, 132, 248, 0.097)',
  business: ', 0 0 4px rgba(228, 192, 110, 0.148)',
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
  return { boxShadow: `${base}${FASHION_HOME_DAYLIGHT_WORLD_HOVER_EDGE_GLOW[accent]}` } as ViewStyle;
}

const FASHION_HOME_DAYLIGHT_WORLD_INNER_RIM: Record<FashionHomeWorldCardDaylightAccent, string> = {
  local: 'rgba(200, 255, 230, 0.68)',
  travel: 'rgba(200, 236, 255, 0.68)',
  academy: 'rgba(230, 210, 255, 0.66)',
  business: 'rgba(255, 230, 186, 0.68)',
};

const FASHION_HOME_DAYLIGHT_WORLD_INNER_RIM_HOVER: Record<FashionHomeWorldCardDaylightAccent, string> = {
  local: 'rgba(200, 255, 230, 0.82)',
  travel: 'rgba(200, 236, 255, 0.82)',
  academy: 'rgba(230, 210, 255, 0.8)',
  business: 'rgba(255, 230, 186, 0.82)',
};

/** Web-only: thin inner luminous rim (semantic, not rainbow). */
export function fashionHomeWebDaylightWorldCardInnerRimStyle(
  accent: FashionHomeWorldCardDaylightAccent,
  hovered = false
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const c = hovered ? FASHION_HOME_DAYLIGHT_WORLD_INNER_RIM_HOVER[accent] : FASHION_HOME_DAYLIGHT_WORLD_INNER_RIM[accent];
  return {
    boxShadow: `inset 0 0 0 1px ${c}`,
  } as ViewStyle;
}

/** HOME.INTERACTION.PREMIUM.1 — magnetic hover caps (desktop web world cards). */
export const FASHION_HOME_WEB_MAGNETIC_MAX_TRANSLATE_PX = 3;
export const FASHION_HOME_WEB_MAGNETIC_MAX_ROTATE_DEG = 0.65;
export const FASHION_HOME_WEB_WORLD_CARD_PRESS_SCALE = 0.994;
export const FASHION_HOME_WEB_EXPLORE_CTA_PULSE_MS = 4200;

export type FashionHomeWebMagneticOffset = Readonly<{
  translateX: number;
  translateY: number;
  rotateDeg: number;
}>;

/** Web + native reduce-motion (SSR-safe). */
export function useFashionHomePrefersReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const apply = (v: boolean) => {
      if (!cancelled) setReduceMotion(v);
    };
    const p = AccessibilityInfo.isReduceMotionEnabled?.();
    if (p && typeof (p as Promise<boolean>).then === 'function') {
      void (p as Promise<boolean>).then(apply).catch(() => {});
    }
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', apply);
    let mqRemove: (() => void) | undefined;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
      if (mq) {
        apply(mq.matches);
        const handler = (e: MediaQueryListEvent) => apply(e.matches);
        mq.addEventListener('change', handler);
        mqRemove = () => mq.removeEventListener('change', handler);
      }
    }
    return () => {
      cancelled = true;
      sub?.remove?.();
      mqRemove?.();
    };
  }, []);
  return reduceMotion;
}

export function computeFashionHomeWebMagneticOffset(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number }
): FashionHomeWebMagneticOffset {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const nx = rect.width > 0 ? (clientX - cx) / (rect.width / 2) : 0;
  const ny = rect.height > 0 ? (clientY - cy) / (rect.height / 2) : 0;
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  return {
    translateX: clamp(nx) * FASHION_HOME_WEB_MAGNETIC_MAX_TRANSLATE_PX,
    translateY: clamp(ny) * FASHION_HOME_WEB_MAGNETIC_MAX_TRANSLATE_PX,
    rotateDeg: clamp(nx) * FASHION_HOME_WEB_MAGNETIC_MAX_ROTATE_DEG,
  };
}

/** Web: magnetic pointer offset + subtle lift (no motion when reduced-motion). */
export function fashionHomeWebMagneticMotionStyle(
  offset: FashionHomeWebMagneticOffset | null,
  hovered: boolean
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const ms = FASHION_HOME_DAYLIGHT_TRANSITION_MS;
  const o = offset ?? { translateX: 0, translateY: 0, rotateDeg: 0 };
  return {
    transform: [
      { translateX: o.translateX },
      { translateY: o.translateY + (hovered ? -1 : 0) },
      { rotate: `${o.rotateDeg}deg` },
      { scale: hovered ? 1.004 : 1 },
    ],
    transition: `transform ${ms}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${ms}ms ease-out`,
  } as ViewStyle;
}

/** Web: world-card host motion — magnetic when allowed, static rim-only otherwise. */
export function fashionHomeWebWorldCardHostMotionStyle(
  cardAccent: FashionHomeWorldCardDaylightAccent,
  activeAccent: FashionHomeWorldCardDaylightAccent | null,
  magnetic: FashionHomeWebMagneticOffset | null,
  reduceMotion: boolean
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const hovered = activeAccent === cardAccent;
  if (reduceMotion) return {};
  return fashionHomeWebMagneticMotionStyle(hovered ? magnetic : null, hovered);
}

/** @deprecated Use `fashionHomeWebWorldCardHostMotionStyle`. */
export function fashionHomeWebWorldCardHostHoverMotionStyle(hovered: boolean): ViewStyle {
  if (Platform.OS !== 'web' || !hovered) return {};
  const ms = FASHION_HOME_DAYLIGHT_TRANSITION_MS;
  return {
    transform: [{ translateY: -1 }, { scale: 1.004 }],
    transition: `transform ${ms}ms cubic-bezier(0.22, 1, 0.36, 1), box-shadow ${ms}ms ease-out`,
  } as ViewStyle;
}

/** Web: edge-lit image lift on hover (world card interior). */
export function fashionHomeWebWorldCardImageHoverStyle(hovered: boolean): ImageStyle {
  if (Platform.OS !== 'web' || !hovered) return {};
  return { filter: 'contrast(1.01) saturate(1.01)' } as ImageStyle;
}

/** Web: world-card host pointer handlers (magnetic + hover accent). */
export function createFashionHomeWebWorldCardPointerHandlers(options: {
  accent: FashionHomeWorldCardDaylightAccent;
  reduceMotion: boolean;
  onActiveAccent: (accent: FashionHomeWorldCardDaylightAccent | null) => void;
  onMagnetic: (offset: FashionHomeWebMagneticOffset | null) => void;
}): {
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onPointerMove?: (event: {
    nativeEvent: { clientX?: number; clientY?: number };
    currentTarget: unknown;
  }) => void;
} {
  if (Platform.OS !== 'web') return {};
  const { accent, reduceMotion, onActiveAccent, onMagnetic } = options;
  return {
    onPointerEnter: () => onActiveAccent(accent),
    onPointerLeave: () => {
      onActiveAccent(null);
      onMagnetic(null);
    },
    onPointerMove: (event) => {
      onActiveAccent(accent);
      if (reduceMotion) return;
      const target = event.currentTarget as { getBoundingClientRect?: () => DOMRect } | null;
      const rect = target?.getBoundingClientRect?.();
      if (!rect) return;
      const clientX = event.nativeEvent.clientX ?? 0;
      const clientY = event.nativeEvent.clientY ?? 0;
      onMagnetic(computeFashionHomeWebMagneticOffset(clientX, clientY, rect));
    },
  };
}

/** Web: Explore VIONA primary CTA — gold glass material. */
export function fashionHomeWebExploreCtaMaterialStyle(
  hovered: boolean,
  pressed: boolean
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const ms = FASHION_HOME_DAYLIGHT_TRANSITION_MS;
  const base =
    'inset 0 1px 0 rgba(255,248,232,0.16), 0 0 0 1px rgba(238, 206, 128, 0.58), 0 2px 10px rgba(8, 12, 20, 0.3)';
  const hoverLift =
    hovered && !pressed
      ? ', 0 0 0 1px rgba(255, 228, 168, 0.72), 0 0 6px rgba(238, 206, 128, 0.12), 0 4px 12px rgba(8, 12, 20, 0.34)'
      : '';
  return {
    boxShadow: `${base}${hoverLift}`,
    transition: `box-shadow ${ms}ms ease-out, transform ${ms}ms cubic-bezier(0.22, 1, 0.36, 1)`,
  } as ViewStyle;
}

/** Web: Explore CTA press — slight compress, no bounce. */
export function fashionHomeWebExploreCtaPressStyle(pressed: boolean): ViewStyle {
  if (Platform.OS !== 'web' || !pressed) return {};
  return {
    transform: [{ scale: 0.994 }],
    opacity: 0.96,
  } as ViewStyle;
}

/** Web: animated gold glow radius for Explore CTA pulse (caller drives Animated.Value). */
export function fashionHomeWebExploreCtaPulseShadowStyle(
  glowRadius: number,
  glowOpacity: number
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    shadowColor: 'rgba(238, 206, 128, 0.72)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowOpacity,
    shadowRadius: glowRadius,
  } as ViewStyle;
}

/** Web-only: hero image — no broad lift wash (keeps panel clear). */
export const FASHION_HOME_DAYLIGHT_HERO_IMAGE_FILTER_WEB = 'none';

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

/** Web: radial hero text scrim — smooth dissolve, no vertical rectangle edge. */
export function fashionHomeWebDaylightHeroTextScrimStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    backgroundImage:
      'radial-gradient(ellipse 115% 150% at 0% 50%, rgba(4, 7, 12, 0.2) 0%, rgba(4, 7, 12, 0.065) 34%, rgba(4, 7, 12, 0.012) 52%, rgba(4, 7, 12, 0) 62%)',
  } as ViewStyle;
}

/** Web: outer hero shell — 1px rim + restrained depth (no luminous slab). */
export function fashionHomeWebDaylightHeroShellMaterialStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    boxShadow: fashionHomeGlassBoxShadow([
      `0 0 0 1px ${FASHION_HOME_DAYLIGHT_FRAME_BORDER}`,
      FASHION_HOME_DAYLIGHT_HERO_EDGE_GLOW,
      FASHION_HOME_DAYLIGHT_HERO_INNER_RIM,
      FASHION_HOME_DAYLIGHT_HERO_INNER_HIGHLIGHT,
      FASHION_HOME_GLASS_DEPTH_SHADOW,
    ]),
  } as ViewStyle;
}

/** Web: inner frame accent — complements shell stack without doubling outer glow. */
export function fashionHomeWebDaylightHeroFrameDepthStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    boxShadow: fashionHomeGlassBoxShadow([
      'inset 0 0 0 1px rgba(148, 210, 255, 0.12)',
      'inset 0 1px 0 rgba(255, 248, 235, 0.034)',
    ]),
  } as ViewStyle;
}

/** Web: localized radial scrim behind card title copy only. */
export function fashionHomeWebDaylightWorldCardTextScrimStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    backgroundImage:
      'radial-gradient(ellipse 90% 72% at 0% 44%, rgba(4, 7, 12, 0.17) 0%, rgba(4, 7, 12, 0.052) 48%, rgba(4, 7, 12, 0) 62%)',
  } as ViewStyle;
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
    fill: 'rgba(10, 14, 22, 0.23)',
    border: 'rgba(228, 192, 110, 0.26)',
    iconBg: 'rgba(238, 206, 128, 0.05)',
    iconRim: 'rgba(238, 206, 128, 0.2)',
    webMaterial: '0 1px 3px rgba(4, 8, 14, 0.1)',
    sheen: ['rgba(255, 248, 228, 0.05)', 'rgba(255, 248, 228, 0)'],
  },
  cyan: {
    fill: 'rgba(10, 14, 22, 0.23)',
    border: 'rgba(95, 195, 248, 0.24)',
    iconBg: 'rgba(128, 210, 255, 0.044)',
    iconRim: 'rgba(128, 210, 255, 0.2)',
    webMaterial: '0 1px 3px rgba(4, 8, 14, 0.1)',
    sheen: ['rgba(210, 238, 255, 0.04)', 'rgba(200, 235, 255, 0)'],
  },
  emerald: {
    fill: 'rgba(10, 14, 22, 0.23)',
    border: 'rgba(72, 195, 155, 0.24)',
    iconBg: 'rgba(88, 214, 168, 0.044)',
    iconRim: 'rgba(88, 214, 168, 0.2)',
    webMaterial: '0 1px 3px rgba(4, 8, 14, 0.1)',
    sheen: ['rgba(195, 250, 225, 0.04)', 'rgba(180, 245, 220, 0)'],
  },
  violet: {
    fill: 'rgba(10, 14, 22, 0.23)',
    border: 'rgba(168, 138, 238, 0.24)',
    iconBg: 'rgba(176, 140, 255, 0.044)',
    iconRim: 'rgba(176, 140, 255, 0.2)',
    webMaterial: '0 1px 3px rgba(4, 8, 14, 0.1)',
    sheen: ['rgba(228, 210, 255, 0.04)', 'rgba(220, 200, 255, 0)'],
  },
  blue: {
    fill: 'rgba(10, 14, 22, 0.23)',
    border: 'rgba(120, 196, 255, 0.24)',
    iconBg: 'rgba(120, 196, 255, 0.044)',
    iconRim: 'rgba(120, 196, 255, 0.18)',
    webMaterial: '0 1px 3px rgba(4, 8, 14, 0.1)',
    sheen: ['rgba(210, 232, 255, 0.04)', 'rgba(200, 228, 255, 0)'],
  },
  sos: {
    fill: 'rgba(18, 8, 12, 0.26)',
    border: 'rgba(255, 92, 108, 0.28)',
    iconBg: 'rgba(255, 92, 108, 0.05)',
    iconRim: 'rgba(255, 92, 108, 0.22)',
    webMaterial: '0 1px 3px rgba(4, 8, 14, 0.1)',
    sheen: ['rgba(255, 190, 198, 0.04)', 'rgba(255, 180, 190, 0)'],
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
    shadowOpacity: 0.055,
    shadowRadius: 0.5,
    elevation: 1,
  };
}

const FASHION_HOME_DAYLIGHT_QUICK_ACTION_INNER_HIGHLIGHT: Record<FashionHomeQuickActionAccent, string> = {
  gold: 'inset 0 0 0 1px rgba(228, 192, 110, 0.12)',
  cyan: 'inset 0 0 0 1px rgba(95, 195, 248, 0.11)',
  emerald: 'inset 0 0 0 1px rgba(72, 195, 155, 0.11)',
  violet: 'inset 0 0 0 1px rgba(168, 138, 238, 0.11)',
  blue: 'inset 0 0 0 1px rgba(120, 196, 255, 0.11)',
  sos: 'inset 0 0 0 1px rgba(255, 92, 108, 0.13)',
};

const FASHION_HOME_DAYLIGHT_QUICK_ACTION_HOVER_BORDER: Record<FashionHomeQuickActionAccent, string> = {
  gold: 'rgba(228, 192, 110, 0.38)',
  cyan: 'rgba(95, 195, 248, 0.36)',
  emerald: 'rgba(72, 195, 155, 0.36)',
  violet: 'rgba(168, 138, 238, 0.36)',
  blue: 'rgba(120, 196, 255, 0.36)',
  sos: 'rgba(255, 92, 108, 0.42)',
};

const FASHION_HOME_DAYLIGHT_QUICK_ACTION_DEFAULT_EDGE_GLOW: Record<FashionHomeQuickActionAccent, string> = {
  gold: '0 0 2px rgba(228, 192, 110, 0.058), 0 0 3px rgba(228, 192, 110, 0.072)',
  cyan: '0 0 2px rgba(95, 195, 248, 0.055), 0 0 3px rgba(95, 195, 248, 0.069)',
  emerald: '0 0 2px rgba(72, 195, 155, 0.055), 0 0 3px rgba(72, 195, 155, 0.069)',
  violet: '0 0 2px rgba(168, 138, 238, 0.055), 0 0 3px rgba(168, 138, 238, 0.069)',
  blue: '0 0 2px rgba(120, 196, 255, 0.055), 0 0 3px rgba(120, 196, 255, 0.069)',
  sos: '0 0 2px rgba(255, 92, 108, 0.062), 0 0 3px rgba(255, 92, 108, 0.08)',
};

const FASHION_HOME_DAYLIGHT_QUICK_ACTION_HOVER_EDGE_GLOW: Record<FashionHomeQuickActionAccent, string> = {
  gold: '0 0 3px rgba(228, 192, 110, 0.104)',
  cyan: '0 0 3px rgba(95, 195, 248, 0.104)',
  emerald: '0 0 3px rgba(72, 195, 155, 0.104)',
  violet: '0 0 3px rgba(168, 138, 238, 0.104)',
  blue: '0 0 3px rgba(120, 196, 255, 0.104)',
  sos: '0 0 3px rgba(255, 92, 108, 0.124)',
};

/** Web: single 1px rim via box-shadow (avoids thick border + shadow stack). */
export function fashionHomeWebDaylightQuickActionPillGlassStyle(
  accent: FashionHomeQuickActionAccent,
  hovered = false
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const q = FASHION_HOME_DAYLIGHT_QUICK_ACTION[accent];
  const rim = hovered ? FASHION_HOME_DAYLIGHT_QUICK_ACTION_HOVER_BORDER[accent] : q.border;
  const layers = [
    `0 0 0 1px ${rim}`,
    FASHION_HOME_DAYLIGHT_QUICK_ACTION_INNER_HIGHLIGHT[accent],
    hovered
      ? FASHION_HOME_DAYLIGHT_QUICK_ACTION_HOVER_EDGE_GLOW[accent]
      : FASHION_HOME_DAYLIGHT_QUICK_ACTION_DEFAULT_EDGE_GLOW[accent],
    q.webMaterial,
  ];
  return {
    backgroundColor: q.fill,
    borderWidth: 0,
    boxShadow: fashionHomeGlassBoxShadow(layers),
  } as ViewStyle;
}

/** @deprecated Use `fashionHomeWebDaylightQuickActionPillGlassStyle`. */
export function fashionHomeWebDaylightQuickActionHoverBorderStyle(
  accent: FashionHomeQuickActionAccent,
  hovered = false
): ViewStyle {
  return fashionHomeWebDaylightQuickActionPillGlassStyle(accent, hovered);
}

/** @deprecated Use `fashionHomeWebDaylightQuickActionPillGlassStyle`. */
export function fashionHomeWebDaylightQuickActionPillMaterialStyle(
  accent: FashionHomeQuickActionAccent,
  _hovered = false
): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return { boxShadow: FASHION_HOME_DAYLIGHT_QUICK_ACTION[accent].webMaterial } as ViewStyle;
}

/** Web: native-only inset rim — web uses `borderWidth` + hover border brighten. */
export function fashionHomeWebDaylightQuickActionInnerRimStyle(accent: FashionHomeQuickActionAccent): ViewStyle {
  if (Platform.OS === 'web') return {};
  const b = FASHION_HOME_DAYLIGHT_QUICK_ACTION[accent].border;
  return {
    ...StyleSheet.absoluteFillObject,
    borderRadius: vionaTokens.radius.pill,
    boxShadow: `inset 0 0 0 1px ${b}`,
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
 * NO_CLIP.FINAL.1 — stage rail spans viewport by canceling scroll pad only (never bleed-sized width).
 */
export function fashionHomeWebOpeningStageBreakoutStyle(
  padPx: number,
  rightBleedPx: number = FASHION_HOME_WEB_OPENING_STAGE_STAGE_RIGHT_BLEED_PX
): ViewStyle {
  if (Platform.OS !== 'web' || padPx <= 0) return {};
  const isOpeningStageRail = rightBleedPx >= FASHION_HOME_WEB_OPENING_STAGE_STAGE_RIGHT_BLEED_PX;
  if (isOpeningStageRail) {
    return {
      marginLeft: -padPx,
      marginRight: -padPx,
      width: `calc(100% + ${padPx * 2}px)` as ViewStyle['width'],
      alignSelf: 'stretch',
    } as ViewStyle;
  }
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

/** Inner horizontal inset shared by hero/cards, hub, and Care Heart Fund (web fashion home). */
export function fashionHomeWebOpeningStageSharedRailInsetStyle(padPx: number): ViewStyle {
  if (Platform.OS !== 'web' || padPx <= 0) return {};
  return {
    paddingLeft: padPx,
    paddingRight: FASHION_HOME_WEB_OPENING_STAGE_VIEWPORT_RIGHT_INSET_PX,
  } as ViewStyle;
}

/** Fullscreen hub pull-up disabled — stage grid-top nudge moves cards + dock together. */
export function fashionHomeWebOpeningStageFullscreenHubPullUpPx(): number {
  return 0;
}

/** Fullscreen: margin above quick-action dock rail (no negative pull-up). */
export function fashionHomeWebOpeningStageHubDockFullscreenStyle(isFullscreen: boolean): ViewStyle {
  if (Platform.OS !== 'web' || !isFullscreen) return {};
  return {
    marginTop: FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_DOCK_GAP_PX,
  } as ViewStyle;
}

/** Viewport-contained breakout + inset — same outer rail as opening-stage hero/cards. */
export function fashionHomeWebOpeningStageSharedRailWrapperStyle(
  padPx: number,
  options?: { pullUpPx?: number }
): ViewStyle {
  if (Platform.OS !== 'web' || padPx <= 0) return {};
  const pullUpPx = options?.pullUpPx ?? 0;
  return {
    ...fashionHomeWebOpeningStageBreakoutStyle(padPx),
    ...fashionHomeWebOpeningStageSharedRailInsetStyle(padPx),
    alignSelf: 'stretch',
    ...(pullUpPx > 0 ? { marginTop: -pullUpPx } : {}),
  } as ViewStyle;
}

/** Fullscreen hub: hide prompt only; quick-action grid stays visible. */
export function fashionHomeWebOpeningStageHubPromptFullscreenStyle(
  isFullscreen: boolean
): ViewStyle {
  if (Platform.OS !== 'web' || !isFullscreen) return {};
  return { display: 'none', height: 0, marginBottom: 0, overflow: 'hidden' } as ViewStyle;
}

/** Fullscreen: tighter dock padding so two pill rows fit in viewport. */
export function fashionHomeWebOpeningStageQuickActionStripFullscreenStyle(
  isFullscreen: boolean
): ViewStyle {
  if (Platform.OS !== 'web' || !isFullscreen) return {};
  return {
    paddingTop: 10,
    paddingBottom: 10,
  } as ViewStyle;
}

/** Fullscreen-only grid column top breathing (applied from HomeScreen when opening stage active). */
export function fashionHomeWebOpeningStageFullscreenGridColumnStyle(
  padPx: number,
  isFullscreen: boolean
): ViewStyle {
  const base = fashionHomeWebOpeningStageGridColumnStyle(padPx, false);
  if (Platform.OS !== 'web' || !isFullscreen || padPx <= 0) return base;
  return {
    ...base,
    paddingTop: FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_COMPACT_GRID_TOP_PX,
  } as ViewStyle;
}

/** Shared grid column: hero block + card row (matches command bar `layout.pad`). */
export function fashionHomeWebOpeningStageGridColumnStyle(
  padPx: number,
  _isFullscreen = false
): ViewStyle {
  if (Platform.OS !== 'web' || padPx <= 0) return {};
  return {
    width: '100%',
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    ...fashionHomeWebOpeningStageSharedRailInsetStyle(padPx),
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
export function fashionHomeWebOpeningStageHeroFrameStyle(
  heroHeightPx: number,
  isFullscreen = false
): ViewStyle {
  if (Platform.OS !== 'web' || heroHeightPx <= 0) return {};
  const heightPx = isFullscreen
    ? fashionHomeWebOpeningStageFullscreenHeroFrameHeightPx(heroHeightPx)
    : heroHeightPx;
  return {
    width: '100%',
    alignSelf: 'stretch',
    height: heightPx,
    minHeight: heightPx,
    maxHeight: heightPx,
    flexShrink: 0,
    position: 'relative',
  } as ViewStyle;
}

/** Fullscreen hero frame height after trim (for stage budget / QA). */
export function fashionHomeWebOpeningStageFullscreenHeroFrameHeightPx(
  heroHeightPx: number
): number {
  if (heroHeightPx <= 0) return 0;
  return (
    Math.max(0, heroHeightPx - FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_HERO_TRIM_PX) +
    FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_PREMIUM_HERO_FRAME_EXTEND_PX
  );
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

/** World cards directly under hero frame — fullscreen uses explicit 4px gap (no transform). */
export function fashionHomeWebOpeningStageWorldStripBelowHeroStyle(isFullscreen = false): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const marginTop = isFullscreen
    ? FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_CARD_GAP_PX
    : FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX;
  return {
    width: '100%',
    flexShrink: 0,
    marginTop,
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

/** Opening-stage world card cell — slight height lift when budget allows. */
export function fashionHomeWebOpeningStageCardCellStyle(): ViewStyle {
  if (Platform.OS !== 'web') return {};
  return {
    alignSelf: 'stretch',
    minHeight: FASHION_HOME_WEB_OPENING_STAGE_WORLD_CARD_MIN_HEIGHT_PX,
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
  /** Fullscreen: reserve action dock (2 rows, title hidden) so opening stage does not push hub off-screen. */
  const hubPeekReserve = input.isFullscreen
    ? FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_RESERVE_PX
    : 0;
  const stackGap = input.isFullscreen
    ? FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_CARD_GAP_PX
    : FASHION_HOME_WEB_OPENING_STAGE_HERO_TO_CARD_GAP_PX;
  const contentBudget = Math.max(
    280,
    availableBelowChrome -
      hubPeekReserve -
      FASHION_HOME_WEB_OPENING_STAGE_SAFE_BOTTOM_GAP_PX
  );
  const gridTopPx = input.isFullscreen
    ? FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_COMPACT_GRID_TOP_PX
    : 0;
  const innerBudget = Math.max(200, contentBudget - gridTopPx);
  const heroMaxPx =
    input.viewportHeightPx > 900
      ? Math.min(480, FASHION_HOME_WEB_OPENING_STAGE_HERO_MAX_PX + 48)
      : FASHION_HOME_WEB_OPENING_STAGE_HERO_MAX_PX;
  const heroBudgetPx = innerBudget - cardRowH - stackGap;
  let heroHeightPx = Math.min(heroMaxPx, Math.max(0, heroBudgetPx));

  if (input.isFullscreen) {
    const stackWithHeroMin =
      FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX + cardRowH + stackGap;
    if (stackWithHeroMin <= innerBudget) {
      heroHeightPx = Math.max(FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX, heroHeightPx);
    }
    heroHeightPx = Math.min(heroHeightPx, Math.max(0, innerBudget - cardRowH - stackGap));

    const chromeForDockFit = Math.max(
      input.chromeAboveScrollPx,
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_CHROME_FLOOR_PX
    );
    const maxStageHeightPx =
      input.viewportHeightPx -
      chromeForDockFit -
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_DOCK_GAP_PX -
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_PANEL_ESTIMATE_PX -
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_VIEWPORT_BOTTOM_AIR_PX +
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_PREMIUM_HERO_FRAME_EXTEND_PX;
    const maxHeroFramePx = maxStageHeightPx - gridTopPx - cardRowH - stackGap;
    const maxHeroPx =
      maxHeroFramePx +
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_HERO_TRIM_PX -
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_PREMIUM_HERO_FRAME_EXTEND_PX;
    heroHeightPx = Math.min(heroHeightPx, Math.max(0, maxHeroPx));
    heroHeightPx = Math.min(heroHeightPx, Math.max(0, innerBudget - cardRowH - stackGap));
    heroHeightPx = Math.max(
      0,
      heroHeightPx - FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_NUDGE_VIEWPORT_PX
    );
    const heroWithBonusPx = Math.min(
      heroMaxPx,
      heroHeightPx + FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_HERO_HEIGHT_BONUS_PX
    );
    const bonusFramePx = fashionHomeWebOpeningStageFullscreenHeroFrameHeightPx(heroWithBonusPx);
    const bonusStagePx = gridTopPx + bonusFramePx + cardRowH + stackGap;
    const dockStackBottomPx =
      chromeForDockFit +
      bonusStagePx +
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_FIT_DOCK_GAP_PX +
      FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_DOCK_PANEL_ESTIMATE_PX;
    if (
      bonusStagePx <= maxStageHeightPx &&
      dockStackBottomPx <=
        input.viewportHeightPx - FASHION_HOME_WEB_OPENING_STAGE_FULLSCREEN_VIEWPORT_BOTTOM_AIR_PX
    ) {
      heroHeightPx = heroWithBonusPx;
    }
  } else {
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
  }

  const stageHeight = input.isFullscreen
    ? gridTopPx +
      fashionHomeWebOpeningStageFullscreenHeroFrameHeightPx(heroHeightPx) +
      cardRowH +
      stackGap
    : heroHeightPx + cardRowH + stackGap;
  return { stageHeight, heroHeightPx, cardRowH, hubPeekReserve };
}

/** @deprecated Use `fashionHomeWebOpeningStageSharedRailWrapperStyle`. */
export function fashionHomeWebOpeningStageHubWrapperStyle(
  padPx: number,
  options?: { pullUpPx?: number }
): ViewStyle {
  return fashionHomeWebOpeningStageSharedRailWrapperStyle(padPx, options);
}

/** Web: premium edge-lit hover on command-rail utilities. */
export function fashionHomeWebCommandUtilityHoverStyle(
  hovered: boolean,
  daylightBoost: boolean,
  options?: { sos?: boolean }
): ViewStyle {
  if (Platform.OS !== 'web' || !hovered) return {};
  const ms = FASHION_HOME_DAYLIGHT_TRANSITION_MS;
  if (options?.sos) {
    return {
      backgroundColor: 'rgba(255, 92, 108, 0.07)',
      boxShadow: fashionHomeGlassBoxShadow([
        'inset 0 0 0 1px rgba(255, 92, 108, 0.4)',
        '0 0 3px rgba(255, 92, 108, 0.09)',
        '0 1px 4px rgba(8, 6, 10, 0.18)',
      ]),
      transition: `background-color ${ms}ms ease-out, box-shadow ${ms}ms ease-out, transform ${ms}ms ease-out`,
    } as ViewStyle;
  }
  const rim = daylightBoost
    ? 'inset 0 0 0 1px rgba(148, 210, 255, 0.36)'
    : 'inset 0 0 0 1px rgba(252, 236, 200, 0.38)';
  const edgeGlow = daylightBoost
    ? '0 0 3px rgba(148, 210, 255, 0.088)'
    : '0 0 3px rgba(252, 228, 168, 0.088)';
  return {
    backgroundColor: daylightBoost ? 'rgba(255, 255, 255, 0.006)' : 'rgba(255, 255, 255, 0.005)',
    boxShadow: fashionHomeGlassBoxShadow([rim, edgeGlow, '0 1px 4px rgba(6, 10, 18, 0.16)']),
    transition: `background-color ${ms}ms ease-out, box-shadow ${ms}ms ease-out, transform ${ms}ms ease-out`,
  } as ViewStyle;
}

/** Web: command utility press feedback. */
export function fashionHomeWebCommandUtilityPressStyle(pressed: boolean): ViewStyle {
  if (Platform.OS !== 'web' || !pressed) return {};
  return {
    transform: [{ scale: 0.992 }],
    opacity: 0.94,
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
    shadowOpacity: hovered ? 0.22 : 0.14,
    shadowRadius: hovered ? 1.5 : 0.5,
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
