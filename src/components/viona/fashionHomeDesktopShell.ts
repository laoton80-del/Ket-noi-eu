import { Platform, StyleSheet, type ViewStyle } from 'react-native';

import { vionaTokens } from '../../design';

/** Desktop fashion hero frame aspect (width / height); slightly wider than asset for ~0.5cm less height at 1280px. */
export const FASHION_HOME_DESKTOP_HERO_ASPECT = 1280 / 410;

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
 * VIONA.HOME.FULLSCREEN.BOTTOM.BREATHING.1 — pull the world-card row slightly toward the living hero (~2mm)
 * without retuning hero or rail. Subtracted from the grid’s top margin on Fashion Home desktop web.
 */
export const FASHION_HOME_WORLD_CARD_ROW_NUDGE_UP_PX = 7;

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
