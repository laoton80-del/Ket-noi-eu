import { Platform, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native';

import {
  FASHION_HOME_WEB_OPENING_STAGE_HERO_MAX_PX,
  FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX,
  isHubTabletPortraitViewport,
  mobileHubDynamicHeroFrameStyle,
} from './fashionHomeDesktopShell';
import { LOCAL_HERO_LABEL_AWARE_MAX_BONUS_PX } from './local/LocalDynamicHero';
import { FASHION_HOME_DESKTOP_MIN_WIDTH } from '../../navigation/fashionHomeDesktopShell';

/** Pack 62L — desktop web-normal clean hero stays active from this width even when viewport height is short. */
export const DESKTOP_WEB_NORMAL_MIN_WIDTH = 1024;

/** Local dynamic hero opening frame aspect (1600×624 family). */
export const DYNAMIC_HERO_OPENING_FRAME_ASPECT = 1600 / 624;

/**
 * Raster bucket for dynamic hero selection (Pack 60ZA).
 * - webNormal: desktop web opening stage (~2.887 frame)
 * - webFullscreen: desktop web fullscreen (~3.833 frame)
 * - compactLandscape: short / wide web hero frame (~3.4–3.5)
 * - mobilePortrait: phone portrait (~1.35–1.42)
 */
export type DynamicHeroAssetMode =
  | 'webNormal'
  | 'webFullscreen'
  | 'mobilePortrait'
  | 'compactLandscape';

/** @deprecated Use {@link DynamicHeroAssetMode}. */
export type DynamicHeroLegacyDeviceType = 'web' | 'mobile';

export function isDynamicHeroWebAssetMode(mode: DynamicHeroAssetMode): boolean {
  return mode === 'webNormal' || mode === 'webFullscreen' || mode === 'compactLandscape';
}

/**
 * Pack 62L — desktop web-normal lane (width wins over short height; not fullscreen).
 */
export function isDesktopWebNormalViewport(
  viewportWidth: number,
  isWebFullscreen: boolean
): boolean {
  return (
    Platform.OS === 'web' &&
    viewportWidth >= DESKTOP_WEB_NORMAL_MIN_WIDTH &&
    !isWebFullscreen
  );
}

/**
 * Pack 62L — compact/legacy hero only for sub-desktop widths or true mobile landscape.
 * Desktop width >= 1024 must not fall into compact mode because of short browser height.
 */
export function isCompactHeroViewport(
  viewportWidth: number,
  viewportHeight: number,
  isWebFullscreen: boolean
): boolean {
  if (isDesktopWebNormalViewport(viewportWidth, isWebFullscreen)) return false;
  if (viewportHeight <= 0) return false;
  return viewportHeight < 520 || viewportWidth / viewportHeight > 1.8;
}

/**
 * Stable hero asset mode from viewport + fullscreen (document or shell fullscreen on desktop web).
 */
export function resolveDynamicHeroAssetMode(
  viewportWidth: number,
  viewportHeight: number,
  isWebFullscreen: boolean
): DynamicHeroAssetMode {
  const compactLandscape = isCompactHeroViewport(viewportWidth, viewportHeight, isWebFullscreen);
  const desktopWeb =
    Platform.OS === 'web' &&
    viewportWidth >= FASHION_HOME_DESKTOP_MIN_WIDTH &&
    !compactLandscape;

  if (isDesktopWebNormalViewport(viewportWidth, isWebFullscreen)) return 'webNormal';
  if (desktopWeb && isWebFullscreen) return 'webFullscreen';
  if (desktopWeb) return 'webNormal';
  if (Platform.OS === 'web' && compactLandscape) return 'compactLandscape';
  return 'mobilePortrait';
}

/** Maps legacy `web` / `mobile` callers to Pack 60ZA buckets. */
export function dynamicHeroLegacyDeviceToAssetMode(
  deviceType: DynamicHeroLegacyDeviceType,
  isWebFullscreen = false
): DynamicHeroAssetMode {
  if (deviceType === 'mobile') return 'mobilePortrait';
  return isWebFullscreen ? 'webFullscreen' : 'webNormal';
}

/**
 * Opening-stage hero frame sizing — audited from LocalDynamicHero `frameSizing`.
 */
export function computeDynamicHeroOpeningFrameStyle(
  viewportWidth: number,
  viewportHeight: number,
  openingStageHeroMaxPx?: number
): ViewStyle {
  const compactHero = isCompactHeroViewport(viewportWidth, viewportHeight, false);
  const desktopWebHero =
    !isHubTabletPortraitViewport(viewportWidth, viewportHeight) &&
    (isDesktopWebNormalViewport(viewportWidth, false) ||
      (Platform.OS === 'web' &&
        viewportWidth >= FASHION_HOME_DESKTOP_MIN_WIDTH &&
        !compactHero));

  if (desktopWebHero) {
    const heroCap =
      openingStageHeroMaxPx ??
      FASHION_HOME_WEB_OPENING_STAGE_HERO_MAX_PX + LOCAL_HERO_LABEL_AWARE_MAX_BONUS_PX;
    const heroMin =
      openingStageHeroMaxPx != null
        ? Math.min(FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX, heroCap)
        : FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX;
    return {
      aspectRatio: DYNAMIC_HERO_OPENING_FRAME_ASPECT,
      minHeight: heroMin,
      maxHeight: heroCap,
      width: '100%',
    };
  }

  const mobileFrame = mobileHubDynamicHeroFrameStyle(viewportWidth, viewportHeight);
  return {
    minHeight: mobileFrame.minHeight,
    maxHeight: mobileFrame.maxHeight,
    height: mobileFrame.height,
    width: '100%',
  };
}

/** Hub universe for mode-aware image fit (Pack 60ZC — image inside frame only). */
export type DynamicHeroUniverse = 'local' | 'travel';

/** Per-mode image fit inside an unchanged hero frame (cover + scale + focal only). */
export type DynamicHeroImageFit = Readonly<{
  objectPosition: string;
  foregroundScale: number;
  ambientScale: number;
}>;

export const DYNAMIC_HERO_AMBIENT_OPACITY = 0.42;
export const DYNAMIC_HERO_AMBIENT_BLUR_PX = 8;

/** Default focal — matches v2 composed subject band. */
export const DYNAMIC_HERO_DEFAULT_EDITORIAL_FOCAL = '60% 38%';

/** @deprecated Use per-mode presets via {@link resolveDynamicHeroImageFit}. */
export const DYNAMIC_HERO_FOREGROUND_DEZOOM = 0.98;
/** @deprecated Use per-mode presets via {@link resolveDynamicHeroImageFit}. */
export const DYNAMIC_HERO_AMBIENT_EXPAND = 1.02;

export const DYNAMIC_HERO_MEDIA_NATIVE_RESIZE_MODE = 'cover' as const;

/**
 * Pack 60ZE — explicit web presets (Local is reference; Travel mirrors Local ladder).
 * Pack 60ZK2 — webNormal foregroundScale 1.14 (normal-web full-bleed; fullscreen frozen).
 * Pack 60ZL — webNormal edge-to-edge: clip match + img inset-0 cover fill + scale 1.18.
 * Pack 60ZM — webNormal visible crop presets authoritative (ignore scenario focal); stronger scale.
 * Pack 60ZN — stronger normal-web crop (Travel B 1.38/64%, Local B 1.32/66%) + lighter scrim.
 * Pack 60ZO — aggressive normal-web zoom (Local B 1.44/70%, Travel B 1.52/68%).
 * Pack 60ZP — true-aspect normal-web assets; natural fill scale ~1.05, scenario focal allowed.
 * Pack 60ZQ — premium normal-web micro zoom (1.08); true-aspect asset lane unchanged.
 * Pack 60ZR — visible zoom ladder; Local 1.18 / Travel 1.22 (CSS rescue; superseded).
 * Pack 60ZS — true web-normal art masters; natural fill scale 1.00 (max 1.03 seam bump).
 * Pack 60ZY — true-aspect lanes only; no CSS zoom rescue. webNormal/webFullscreen scale ≤1.02.
 * Pack 61D — fullscreen fit lock: scale 1.00 (range 1.00–1.06); preset objectPosition authoritative on webFullscreen.
 * Pack 61I — web-normal flush layer: overscan 1.08 + rightward focal; preset authoritative; lighter scrim.
 * Pack 61J — surgical web-normal reset: single scale/focal/scrim source of truth; center transformOrigin.
 * Pack 61K — blank-slate rewire: one image layer + minimal local readability scrim only.
 * @see DYNAMIC_HERO_WEB_FIT_PRESETS
 */

/** Pack 61K — web-normal-only overscan (fullscreen/mobile frozen). */
export const DYNAMIC_HERO_WEB_NORMAL_SCALE = 1.12;

/** Pack 61K — local web-normal readability scrim (full-frame gradient, not inner box). */
/** Pack 61L — disabled: single-image baseline is premium; text shadows suffice. */
export const DYNAMIC_HERO_WEB_NORMAL_LOCAL_SCRIM_ENABLED = false;

/** Fallback light scrim (Option B) — only if readability audit fails. */
export const DYNAMIC_HERO_WEB_NORMAL_LOCAL_SCRIM_LIGHT = {
  widthPercent: 40,
  peakOpacity: 0.15,
  midOpacityFactor: 0.45,
  gradientLocations: [0, 0.35, 0.55] as const,
} as const;

/** @deprecated Pack 61L — use {@link DYNAMIC_HERO_WEB_NORMAL_LOCAL_SCRIM_LIGHT} if re-enabled. */
export const DYNAMIC_HERO_WEB_NORMAL_LOCAL_SCRIM = {
  widthPercent: 70,
  peakOpacity: 0.31,
  midOpacityFactor: 0.35,
  gradientLocations: [0, 0.38, 0.68] as const,
} as const;

export const DYNAMIC_HERO_WEB_FIT_PRESETS = {
  local: {
    webNormal: {
      objectPosition: '64% 42%',
      foregroundScale: DYNAMIC_HERO_WEB_NORMAL_SCALE,
      ambientScale: 1,
    },
    webFullscreen: {
      objectPosition: '52% 44%',
      foregroundScale: 1,
      ambientScale: 1,
    },
  },
  travel: {
    webNormal: {
      objectPosition: '62% 42%',
      foregroundScale: DYNAMIC_HERO_WEB_NORMAL_SCALE,
      ambientScale: 1,
    },
    webFullscreen: {
      objectPosition: '54% 44%',
      foregroundScale: 1,
      ambientScale: 1,
    },
  },
} as const satisfies Record<
  DynamicHeroUniverse,
  Readonly<Record<'webNormal' | 'webFullscreen', DynamicHeroImageFit>>
>;

/**
 * Mode-aware fit presets — same raster may use different scale/focal per frame mode.
 * webNormal: slightly above 1.0 fills wide frames without dead side bands.
 * webFullscreen: derived from webNormal (see {@link resolveDynamicHeroImageFit}).
 */
const DYNAMIC_HERO_IMAGE_FIT_BY_UNIVERSE: Readonly<
  Record<DynamicHeroUniverse, Readonly<Record<DynamicHeroAssetMode, DynamicHeroImageFit>>>
> = {
  local: {
    webNormal: DYNAMIC_HERO_WEB_FIT_PRESETS.local.webNormal,
    webFullscreen: DYNAMIC_HERO_WEB_FIT_PRESETS.local.webFullscreen,
    mobilePortrait: {
      objectPosition: '60% 38%',
      foregroundScale: 0.98,
      ambientScale: 1.02,
    },
    compactLandscape: {
      objectPosition: '58% 38%',
      foregroundScale: 0.94,
      ambientScale: 1.03,
    },
  },
  travel: {
    webNormal: DYNAMIC_HERO_WEB_FIT_PRESETS.travel.webNormal,
    webFullscreen: DYNAMIC_HERO_WEB_FIT_PRESETS.travel.webFullscreen,
    mobilePortrait: {
      objectPosition: '60% 38%',
      foregroundScale: 0.98,
      ambientScale: 1.02,
    },
    compactLandscape: {
      objectPosition: '56% 36%',
      foregroundScale: 0.94,
      ambientScale: 1.03,
    },
  },
};

/** Maps Pack 60ZA asset mode to legacy web/mobile registry buckets. */
export function dynamicHeroAssetModeToLegacyDevice(
  assetMode: DynamicHeroAssetMode
): DynamicHeroLegacyDeviceType {
  return assetMode === 'mobilePortrait' ? 'mobile' : 'web';
}

export function resolveDynamicHeroImageFit(
  universe: DynamicHeroUniverse,
  assetMode: DynamicHeroAssetMode,
  scenarioObjectPosition?: string
): DynamicHeroImageFit {
  const preset = DYNAMIC_HERO_IMAGE_FIT_BY_UNIVERSE[universe][assetMode];
  if (assetMode === 'webFullscreen' || assetMode === 'webNormal') {
    return {
      objectPosition: preset.objectPosition,
      foregroundScale: preset.foregroundScale,
      ambientScale: preset.ambientScale,
    };
  }
  const objectPosition = scenarioObjectPosition ?? preset.objectPosition;
  return { ...preset, objectPosition: scenarioObjectPosition ?? preset.objectPosition };
}

export function parseDynamicHeroFocal(objectPosition: string): { x: string; y: string } {
  const parts = objectPosition.trim().split(/\s+/);
  return { x: parts[0] ?? '50%', y: parts[1] ?? '50%' };
}

/** Pack 60ZH — full-bleed clip/layer box (no inner inset; overflow only at hero frame). */
export const DYNAMIC_HERO_MEDIA_FULL_BLEED_BOX: ViewStyle = {
  position: 'absolute',
  left: 0,
  right: 0,
  top: 0,
  bottom: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  padding: 0,
};

/**
 * Web-normal image clip — equals hero frame; single overflow:hidden boundary.
 */
export function dynamicHeroMediaImageClipStyle(
  assetMode: DynamicHeroAssetMode,
  desktopWebHero: boolean
): ViewStyle {
  if (Platform.OS === 'web' && desktopWebHero && assetMode === 'webNormal') {
    return {
      ...DYNAMIC_HERO_MEDIA_FULL_BLEED_BOX,
      overflow: 'hidden',
      zIndex: 1,
    };
  }
  return {};
}

/** Web-normal foreground layer wrapper — must match frame (<=1px delta). */
export function dynamicHeroMediaForegroundLayerStyle(
  assetMode: DynamicHeroAssetMode,
  desktopWebHero: boolean
): ViewStyle {
  if (Platform.OS === 'web' && desktopWebHero && assetMode === 'webNormal') {
    return {
      ...DYNAMIC_HERO_MEDIA_FULL_BLEED_BOX,
      overflow: 'hidden',
      zIndex: 1,
    };
  }
  return {};
}

/** Web-normal ambient layer — full frame when visible (hidden via opacity on web-normal). */
export function dynamicHeroMediaAmbientLayerStyle(
  assetMode: DynamicHeroAssetMode,
  desktopWebHero: boolean
): ViewStyle {
  if (Platform.OS === 'web' && desktopWebHero && assetMode === 'webNormal') {
    return {
      ...DYNAMIC_HERO_MEDIA_FULL_BLEED_BOX,
      overflow: 'hidden',
      zIndex: 0,
    };
  }
  return {};
}

/**
 * Pack 61K — blank-slate web-normal gate (desktop web opening stage only).
 */
export function dynamicHeroWebNormalIsActive(
  assetMode: DynamicHeroAssetMode,
  desktopWebHero: boolean
): boolean {
  return Platform.OS === 'web' && desktopWebHero && assetMode === 'webNormal';
}

/**
 * Pack 61K — single full-bleed web-normal image style (one source of truth).
 */
export function dynamicHeroWebNormalImageStyle(universe: DynamicHeroUniverse): ImageStyle {
  return dynamicHeroWebNormalForegroundBleedStyle(
    DYNAMIC_HERO_WEB_FIT_PRESETS[universe].webNormal
  );
}

/** Pack 61K — web-normal clip (absolute fill, one overflow boundary). */
export function dynamicHeroWebNormalClipStyle(): ViewStyle {
  return {
    ...DYNAMIC_HERO_MEDIA_FULL_BLEED_BOX,
    overflow: 'hidden',
    zIndex: 1,
  };
}

/**
 * Pack 61J — web-normal foreground: full-bleed cover + center-origin overscan.
 */
function dynamicHeroWebNormalForegroundBleedStyle(fit: DynamicHeroImageFit): ImageStyle {
  return {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: '100%',
    height: '100%',
    margin: 0,
    padding: 0,
    objectFit: 'cover',
    objectPosition: fit.objectPosition,
    transform: `scale(${fit.foregroundScale})`,
    transformOrigin: 'center center',
  } as unknown as ImageStyle;
}

export type DynamicHeroWebNormalLocalScrim = Readonly<{
  widthPercent: number;
  peakOpacity: number;
  midOpacity: number;
  gradientLocations: readonly [number, number, number];
}>;

/** Pack 61L — local web-normal frame scrim off by default (single-image baseline). */
export function resolveDynamicHeroWebNormalLocalScrim(
  assetMode: DynamicHeroAssetMode,
  desktopWebHero: boolean
): DynamicHeroWebNormalLocalScrim | null {
  if (
    !DYNAMIC_HERO_WEB_NORMAL_LOCAL_SCRIM_ENABLED ||
    Platform.OS !== 'web' ||
    !desktopWebHero ||
    assetMode !== 'webNormal'
  ) {
    return null;
  }
  const spec = DYNAMIC_HERO_WEB_NORMAL_LOCAL_SCRIM_LIGHT;
  return {
    widthPercent: spec.widthPercent,
    peakOpacity: spec.peakOpacity,
    midOpacity: spec.peakOpacity * spec.midOpacityFactor,
    gradientLocations: spec.gradientLocations,
  };
}

/** Pack 61J — travel web-normal has no frame-level left scrim (text veil only). */
export function dynamicHeroWebNormalTravelFrameScrimEnabled(
  assetMode: DynamicHeroAssetMode,
  desktopWebHero: boolean
): boolean {
  return !(Platform.OS === 'web' && desktopWebHero && assetMode === 'webNormal');
}

/** @deprecated Pack 61J — use {@link resolveDynamicHeroWebNormalLocalScrim}. */
export const DYNAMIC_HERO_WEB_NORMAL_SCRIM_GRADIENT_LOCATIONS =
  DYNAMIC_HERO_WEB_NORMAL_LOCAL_SCRIM.gradientLocations;

/** @deprecated Pack 61J — use {@link resolveDynamicHeroWebNormalLocalScrim}. */
export function dynamicHeroWebNormalScrimAdjust(
  assetMode: DynamicHeroAssetMode,
  desktopWebHero: boolean,
  base: Readonly<{ widthPercent: number; maxWidth: number; strength: number }>
): Readonly<{
  widthPercent: number;
  maxWidth: number;
  strength: number;
  gradientLocations: readonly [number, number, number];
}> {
  const local = resolveDynamicHeroWebNormalLocalScrim(assetMode, desktopWebHero);
  if (local) {
    return {
      widthPercent: local.widthPercent,
      maxWidth: 9999,
      strength: local.peakOpacity,
      gradientLocations: local.gradientLocations,
    };
  }
  return { ...base, gradientLocations: [0, 0.48, 1] };
}

/** Web-normal: one visible foreground raster (no stacked fallback under fade). */
export function dynamicHeroWebNormalUsesSingleForeground(
  assetMode: DynamicHeroAssetMode,
  desktopWebHero: boolean
): boolean {
  return dynamicHeroWebNormalIsActive(assetMode, desktopWebHero);
}

/** Web-normal fade layer must fill foreground wrapper (no inner letterbox wrapper). */
export function dynamicHeroMediaImageFadeLayerStyle(
  assetMode: DynamicHeroAssetMode,
  desktopWebHero: boolean
): ViewStyle {
  if (Platform.OS === 'web' && desktopWebHero && assetMode === 'webNormal') {
    return {
      ...DYNAMIC_HERO_MEDIA_FULL_BLEED_BOX,
      overflow: 'hidden',
    };
  }
  return {};
}

/** Image styles for hero raster — web-normal skips absoluteFill merge that caused inset. */
export function dynamicHeroMediaForegroundImageStyleList(
  fit: DynamicHeroImageFit,
  assetMode: DynamicHeroAssetMode,
  desktopWebHero: boolean,
  imageFillStyle: ImageStyle
): ImageStyle[] {
  const { web, native } = dynamicHeroMediaForegroundImageStyles(fit, assetMode);
  if (Platform.OS === 'web' && desktopWebHero && assetMode === 'webNormal') {
    return [web, native];
  }
  return [imageFillStyle, web, native];
}

export function dynamicHeroMediaBackgroundImageStyleList(
  fit: DynamicHeroImageFit,
  assetMode: DynamicHeroAssetMode,
  desktopWebHero: boolean,
  imageFillStyle: ImageStyle
): ImageStyle[] {
  const { web, native } = dynamicHeroMediaBackgroundImageStyles(fit, assetMode);
  if (Platform.OS === 'web' && desktopWebHero && assetMode === 'webNormal') {
    return [web, native];
  }
  return [imageFillStyle, web, native];
}

export function dynamicHeroMediaWebBackgroundStyleFromFit(
  fit: DynamicHeroImageFit,
  assetMode?: DynamicHeroAssetMode
): ImageStyle {
  if (Platform.OS !== 'web') return {};
  if (assetMode === 'webNormal') {
    return { opacity: 0, pointerEvents: 'none' } as ImageStyle;
  }
  const focal = parseDynamicHeroFocal(fit.objectPosition);
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: fit.objectPosition,
    transform: `scale(${fit.ambientScale})`,
    transformOrigin: `${focal.x} ${focal.y}`,
    filter: `blur(${DYNAMIC_HERO_AMBIENT_BLUR_PX}px) saturate(1.04) brightness(0.82)`,
    opacity: DYNAMIC_HERO_AMBIENT_OPACITY,
  } as ImageStyle;
}

export function dynamicHeroMediaWebForegroundStyleFromFit(
  fit: DynamicHeroImageFit,
  assetMode?: DynamicHeroAssetMode
): ImageStyle {
  if (Platform.OS !== 'web') return {};
  if (assetMode === 'webNormal') {
    return dynamicHeroWebNormalForegroundBleedStyle(fit);
  }
  const focal = parseDynamicHeroFocal(fit.objectPosition);
  return {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: fit.objectPosition,
    transform: `scale(${fit.foregroundScale})`,
    transformOrigin: `${focal.x} ${focal.y}`,
  } as ImageStyle;
}

export function dynamicHeroMediaNativeBackgroundStyleFromFit(
  fit: DynamicHeroImageFit,
  assetMode?: DynamicHeroAssetMode
): ImageStyle {
  if (Platform.OS === 'web') {
    return assetMode === 'webNormal' ? { opacity: 0 } : {};
  }
  const focal = parseDynamicHeroFocal(fit.objectPosition);
  return {
    opacity: DYNAMIC_HERO_AMBIENT_OPACITY,
    transform: [{ scale: fit.ambientScale }],
  };
}

export function dynamicHeroMediaNativeForegroundStyleFromFit(
  fit: DynamicHeroImageFit,
  assetMode?: DynamicHeroAssetMode
): ImageStyle {
  if (Platform.OS === 'web') return {};
  return {
    transform: [{ scale: fit.foregroundScale }],
  };
}

/** Foreground image styles — pass assetMode so web-normal uses bleed + no duplicate RN transform. */
export function dynamicHeroMediaForegroundImageStyles(
  fit: DynamicHeroImageFit,
  assetMode: DynamicHeroAssetMode
): Readonly<{ web: ImageStyle; native: ImageStyle }> {
  return {
    web: dynamicHeroMediaWebForegroundStyleFromFit(fit, assetMode),
    native: dynamicHeroMediaNativeForegroundStyleFromFit(fit, assetMode),
  };
}

/** Background/ambient image styles — web-normal hides ambient halo (Pack 60ZG). */
export function dynamicHeroMediaBackgroundImageStyles(
  fit: DynamicHeroImageFit,
  assetMode: DynamicHeroAssetMode
): Readonly<{ web: ImageStyle; native: ImageStyle }> {
  return {
    web: dynamicHeroMediaWebBackgroundStyleFromFit(fit, assetMode),
    native: dynamicHeroMediaNativeBackgroundStyleFromFit(fit, assetMode),
  };
}

/** @deprecated Use {@link dynamicHeroMediaWebBackgroundStyleFromFit}. */
export function dynamicHeroMediaWebBackgroundStyle(objectPosition: string): ImageStyle {
  return dynamicHeroMediaWebBackgroundStyleFromFit({
    objectPosition,
    foregroundScale: DYNAMIC_HERO_FOREGROUND_DEZOOM,
    ambientScale: DYNAMIC_HERO_AMBIENT_EXPAND,
  });
}

/** @deprecated Use {@link dynamicHeroMediaWebForegroundStyleFromFit}. */
export function dynamicHeroMediaWebForegroundStyle(objectPosition: string): ImageStyle {
  return dynamicHeroMediaWebForegroundStyleFromFit({
    objectPosition,
    foregroundScale: DYNAMIC_HERO_FOREGROUND_DEZOOM,
    ambientScale: DYNAMIC_HERO_AMBIENT_EXPAND,
  });
}

/** @deprecated Prefer foreground/background split styles for the two-layer stack. */
export function dynamicHeroMediaWebStyle(objectPosition: string): ImageStyle {
  return dynamicHeroMediaWebForegroundStyle(objectPosition);
}

/** @deprecated Use {@link dynamicHeroMediaNativeBackgroundStyleFromFit}. */
export function dynamicHeroMediaNativeBackgroundStyle(objectPosition: string): ImageStyle {
  return dynamicHeroMediaNativeBackgroundStyleFromFit({
    objectPosition,
    foregroundScale: DYNAMIC_HERO_FOREGROUND_DEZOOM,
    ambientScale: DYNAMIC_HERO_AMBIENT_EXPAND,
  });
}

/** @deprecated Use {@link dynamicHeroMediaNativeForegroundStyleFromFit}. */
export function dynamicHeroMediaNativeForegroundStyle(objectPosition: string): ImageStyle {
  return dynamicHeroMediaNativeForegroundStyleFromFit({
    objectPosition,
    foregroundScale: DYNAMIC_HERO_FOREGROUND_DEZOOM,
    ambientScale: DYNAMIC_HERO_AMBIENT_EXPAND,
  });
}

export const dynamicHeroMediaLayerStyles = StyleSheet.create({
  imageFadeLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  ambientLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  foregroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
