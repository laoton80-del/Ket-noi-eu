/**
 * Pack 62LOCALBRIGHT_POSTPROCESSED_PREVIEW — Local web-normal master hero safe full-bleed baseline.
 * Postprocessed 2590×607 ultra-wide masters; no translateX / no overscan scale.
 * Travel/Home/mobile/fullscreen unchanged.
 */
export const LOCAL_BRIGHT_REAL_CITY_HERO_FIT = {
  backdropScale: 1.07,
  foregroundScale: 1.0,
  backdropBlurPx: 6,
  backdropBrightness: 0.8,
  backdropSaturate: 1.04,
  objectPosition: '48% 42%',
} as const;

/** Card images: full-bleed cover at scale 1.0 (no editorial dezoom inset). */
export const LOCAL_BRIGHT_REAL_CITY_CARD_FIT = {
  backdropScale: 1.0,
  foregroundScale: 1.0,
  backdropBlurPx: 0,
  backdropBrightness: 1.0,
  backdropSaturate: 1.0,
} as const;

export const LOCAL_BRIGHT_REAL_CITY_CARD_HOVER_NETWORK = {
  restOpacity: 0.32,
  hoverOpacity: 0.58,
  transitionMs: 220,
} as const;
