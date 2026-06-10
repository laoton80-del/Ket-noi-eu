/**
 * Pack 61M/62C/62E/62F — web-normal dynamic hero (single image, presentation variants).
 * Desktop web-normal Local + Travel only. Fullscreen/mobile unchanged.
 */
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactElement, ReactNode } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { vionaTokens } from '../../design';
import { LOCAL_BRIGHT_REAL_CITY_HERO_FIT } from '../../design/vionaLocalBrightRealCityFit';
import type { LocalBrightHeroEditorialFit } from './local/localBrightHeroDisplayMode';
import { LOCAL_BRIGHT_HERO_FULLBLEED_COVER_FIT } from './local/localBrightHeroDisplayMode';
import { premiumCrispEdgeStroke, premiumFrameEdgeOverlay } from './fashionHomeDesktopShell';

export type VionaDynamicHeroWebNormalUniverse = 'local' | 'travel';

/** Pack 62E — web-normal match fullscreen look (A=62C baseline, B=fullscreen art, C=optimized final). */
export type WebNormalDesignVariant = 'A' | 'B' | 'C';

/** Selected after Pack 62E variant audit; hard-locked for plain URLs in Pack 62F. */
export const WEB_NORMAL_DESIGN_FINAL_VARIANT: WebNormalDesignVariant = 'C';

/** Pack 62F — plain /local and /travel always resolve to this variant (no query required). */
export const WEB_NORMAL_PLAIN_URL_LOCK_VARIANT: WebNormalDesignVariant = 'C';

/** Pack 62L/62N — desktop web-normal clean hero width gate (must not revert to compact legacy). */
export const DESKTOP_WEB_NORMAL_CLEAN_MIN_WIDTH = 1024;

/** Pack 62N/62O/62P — viewport-aware desktop clean hero height (mobile/fullscreen unchanged). */
export const WEB_NORMAL_CLEAN_FRAME_HEIGHT_MIN_PX = 330;
export const WEB_NORMAL_CLEAN_FRAME_HEIGHT_FLOOR_PX = 340;
export const WEB_NORMAL_CLEAN_FRAME_HEIGHT_TABLET_MAX_PX = 350;
export const WEB_NORMAL_CLEAN_FRAME_HEIGHT_MEDIUM_MAX_PX = 365;
export const WEB_NORMAL_CLEAN_FRAME_HEIGHT_SHORT_MAX_PX = 390;
export const WEB_NORMAL_CLEAN_FRAME_HEIGHT_SHORT_FLOOR_PX = 380;
export const WEB_NORMAL_CLEAN_FRAME_HEIGHT_TALL_MIN_PX = 395;
export const WEB_NORMAL_CLEAN_FRAME_HEIGHT_TALL_MAX_PX = 405;

/** Legacy fixed height before Pack 62N (audit baseline). */
export const WEB_NORMAL_CLEAN_FRAME_HEIGHT_LEGACY_PX = 440;

/**
 * Pack 62P — desktop web-normal frame height (not asset-driven).
 * Tall: clamp(395, vh×0.37, 405). Short landscape: clamp(380, vh×0.43, 390).
 * Medium (768–999): clamp(350, vh×0.47, 365). Tablet width ≤1100: clamp(340, vh×0.45, 350).
 */
export function resolveWebNormalCleanFrameHeightPx(
  viewportWidth: number,
  viewportHeight: number
): number {
  if (viewportWidth < DESKTOP_WEB_NORMAL_CLEAN_MIN_WIDTH || viewportHeight <= 0) {
    return WEB_NORMAL_CLEAN_FRAME_HEIGHT_LEGACY_PX;
  }
  const shortLandscape =
    viewportHeight <= 920 && viewportWidth / viewportHeight >= 1.85;
  if (shortLandscape) {
    return Math.min(
      WEB_NORMAL_CLEAN_FRAME_HEIGHT_SHORT_MAX_PX,
      Math.max(
        WEB_NORMAL_CLEAN_FRAME_HEIGHT_SHORT_FLOOR_PX,
        Math.round(viewportHeight * 0.43)
      )
    );
  }
  if (viewportWidth <= 1100) {
    return Math.min(
      WEB_NORMAL_CLEAN_FRAME_HEIGHT_TABLET_MAX_PX,
      Math.max(WEB_NORMAL_CLEAN_FRAME_HEIGHT_FLOOR_PX, Math.round(viewportHeight * 0.45))
    );
  }
  if (viewportHeight < 1000) {
    return Math.min(
      WEB_NORMAL_CLEAN_FRAME_HEIGHT_MEDIUM_MAX_PX,
      Math.max(350, Math.round(viewportHeight * 0.47))
    );
  }
  return Math.min(
    WEB_NORMAL_CLEAN_FRAME_HEIGHT_TALL_MAX_PX,
    Math.max(WEB_NORMAL_CLEAN_FRAME_HEIGHT_TALL_MIN_PX, Math.round(viewportHeight * 0.37))
  );
}

export function resolveWebNormalCleanFrameHeightForPreset(
  preset: WebNormalVariantPreset,
  viewportWidth: number,
  viewportHeight: number
): number {
  if (viewportWidth < DESKTOP_WEB_NORMAL_CLEAN_MIN_WIDTH) {
    return preset.frameHeightPx;
  }
  return resolveWebNormalCleanFrameHeightPx(viewportWidth, viewportHeight);
}

export type WebNormalAssetLane = 'webNormal' | 'fullscreenLook62e';

export type WebNormalVariantPreset = Readonly<{
  variant: WebNormalDesignVariant;
  frameHeightPx: number;
  scale: number;
  objectPosition: string;
  edgeVignette: boolean;
  assetLane: WebNormalAssetLane;
}>;

const VARIANT_PRESETS: Readonly<
  Record<WebNormalDesignVariant, Readonly<Record<VionaDynamicHeroWebNormalUniverse, Omit<WebNormalVariantPreset, 'variant'>>>>
> = {
  /** 62C baseline — web-normal raster, heavy crop. */
  A: {
    local: {
      frameHeightPx: 440,
      scale: 1.38,
      objectPosition: '74% 42%',
      edgeVignette: true,
      assetLane: 'webNormal',
    },
    travel: {
      frameHeightPx: 440,
      scale: 1.38,
      objectPosition: '72% 42%',
      edgeVignette: true,
      assetLane: 'webNormal',
    },
  },
  /** Fullscreen-approved art + fullscreen focal; moderate scale (no over-crop). */
  B: {
    local: {
      frameHeightPx: 440,
      scale: 1.12,
      objectPosition: '61% 42%',
      edgeVignette: false,
      assetLane: 'fullscreenLook62e',
    },
    travel: {
      frameHeightPx: 440,
      scale: 1.12,
      objectPosition: '60% 40%',
      edgeVignette: false,
      assetLane: 'fullscreenLook62e',
    },
  },
  /** Pack 62AB — 62Y 3:1 masters; full-bleed cover, objectPosition only. */
  C: {
    local: {
      frameHeightPx: 440,
      scale: 1,
      objectPosition: '52% 42%',
      edgeVignette: true,
      assetLane: 'webNormal',
    },
    travel: {
      frameHeightPx: 440,
      scale: 1,
      objectPosition: '54% 42%',
      edgeVignette: true,
      assetLane: 'webNormal',
    },
  },
};

export function readWebNormalDesignVariantFromUrl(): WebNormalDesignVariant | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('heroVariant');
  if (raw === 'A' || raw === 'B' || raw === 'C') return raw;
  return null;
}

/** Pack 62F — operator proof badge via `?pack62fBadge=1` only (never on plain URL). */
export function readPack62fBadgeFromUrl(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('pack62fBadge') === '1';
}

export function resolveWebNormalDesignVariant(
  explicit?: WebNormalDesignVariant | null
): WebNormalDesignVariant {
  if (explicit) return explicit;
  const urlVariant = readWebNormalDesignVariantFromUrl();
  if (urlVariant) return urlVariant;
  return WEB_NORMAL_PLAIN_URL_LOCK_VARIANT;
}

export function getWebNormalVariantPreset(
  universe: VionaDynamicHeroWebNormalUniverse,
  variant?: WebNormalDesignVariant | null
): WebNormalVariantPreset {
  const v = resolveWebNormalDesignVariant(variant);
  const row = VARIANT_PRESETS[v][universe];
  return { variant: v, ...row };
}

export function webNormalVariantFrameStyle(
  preset: WebNormalVariantPreset,
  viewportWidth?: number,
  viewportHeight?: number
): ViewStyle {
  const heightPx =
    viewportWidth != null && viewportHeight != null
      ? resolveWebNormalCleanFrameHeightForPreset(preset, viewportWidth, viewportHeight)
      : preset.frameHeightPx;
  return {
    height: heightPx,
    minHeight: heightPx,
    maxHeight: heightPx,
    aspectRatio: undefined,
  } as ViewStyle;
}

function resolveEffectiveHeroSource(
  _universe: VionaDynamicHeroWebNormalUniverse,
  _preset: WebNormalVariantPreset,
  passedSource: ImageSourcePropType,
  passedFilename?: string
): Readonly<{ source: ImageSourcePropType; filename: string }> {
  // Variant B presentation presets remain; raster resolves from caller-approved passedSource only.
  return { source: passedSource, filename: passedFilename ?? '' };
}

export type VionaDynamicHeroWebNormalCleanProps = Readonly<{
  universe: VionaDynamicHeroWebNormalUniverse;
  source: ImageSourcePropType;
  sourceFilename?: string;
  heroAssetMode?: string;
  designVariant?: WebNormalDesignVariant;
  objectPosition?: string;
  scale?: number;
  overlayEnabled?: boolean;
  frameStyle?: StyleProp<ViewStyle>;
  frameTestID?: string;
  contentStyle?: StyleProp<ViewStyle>;
  contentTestID?: string;
  children?: ReactNode;
  frameFooter?: ReactNode;
  /** Pack 62O — optional lighting network / hover wash layer (above image, below copy). */
  frameLightingOverlay?: ReactNode;
  hoverProps?: Record<string, unknown>;
  /** Pack 62LOCALBRIGHT_FULLBLEED — Local-only full-bleed cover dual-layer (backdrop hidden). */
  localEditorialDualLayer?: boolean;
  localEditorialFit?: LocalBrightHeroEditorialFit;
}>;

function webNormalLocalEditorialBackdropStyle(
  objectPosition: string,
  fit: LocalBrightHeroEditorialFit
): ImageStyle {
  if (Platform.OS === 'web') {
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
      objectPosition,
      transform: `scale(${fit.backdropScale})`,
      transformOrigin: 'center center',
      filter: `blur(${fit.backdropBlurPx}px) brightness(${fit.backdropBrightness}) saturate(${fit.backdropSaturate})`,
    } as unknown as ImageStyle;
  }
  return StyleSheet.absoluteFillObject;
}

function webNormalLocalEditorialForegroundStyle(
  objectPosition: string,
  fit: LocalBrightHeroEditorialFit
): ImageStyle {
  if (Platform.OS === 'web') {
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
      objectPosition,
      ...(fit.foregroundScale !== 1
        ? {
            transform: `scale(${fit.foregroundScale})`,
            transformOrigin: 'center center',
          }
        : null),
    } as unknown as ImageStyle;
  }
  return {
    ...StyleSheet.absoluteFillObject,
    ...(fit.foregroundScale !== 1 ? { transform: [{ scale: fit.foregroundScale }] } : null),
  };
}

function webNormalCleanImageStyle(objectPosition: string, scale: number): ImageStyle {
  /** Pack 62S — never shrink below 1.0; sub-1 transform leaves #020813 frame gaps. Zoom-in (>1) only. */
  const effectiveScale = scale > 1 ? scale : 1;
  if (Platform.OS === 'web') {
    const base: ImageStyle = {
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
      objectPosition,
    } as unknown as ImageStyle;
    if (effectiveScale > 1) {
      return {
        ...base,
        transform: `scale(${effectiveScale})`,
        transformOrigin: 'center center',
      } as unknown as ImageStyle;
    }
    return base;
  }
  return {
    ...StyleSheet.absoluteFillObject,
    ...(effectiveScale > 1 ? { transform: [{ scale: effectiveScale }] } : null),
  };
}

/** Pack 62O/62P — brighter web-normal hero crisp edge (Local emerald / Travel cyan family). */
const WEB_NORMAL_HERO_CRISP_BORDER: Readonly<Record<VionaDynamicHeroWebNormalUniverse, string>> = {
  local: 'rgba(120, 255, 210, 0.54)',
  travel: 'rgba(92, 205, 255, 0.48)',
};

function EdgeVignetteLayer({ subtle }: { subtle?: boolean }): ReactElement {
  const leftPeak = subtle ? 0.1 : 0.14;
  const bottomPeak = subtle ? 0.07 : 0.1;
  return (
    <>
      <LinearGradient
        pointerEvents="none"
        colors={[`rgba(4, 7, 12, ${leftPeak})`, 'rgba(4, 7, 12, 0.04)', 'rgba(4, 7, 12, 0)']}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.edgeVignetteLeft}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(4, 7, 12, 0.06)', 'rgba(4, 7, 12, 0)']}
        locations={[0, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.edgeVignetteTop}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(4, 7, 12, 0)', `rgba(4, 7, 12, ${bottomPeak})`]}
        locations={[0, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.edgeVignetteBottom}
      />
    </>
  );
}

export function VionaDynamicHeroWebNormalClean({
  universe,
  source,
  sourceFilename,
  heroAssetMode = 'webNormal',
  designVariant,
  objectPosition,
  scale,
  overlayEnabled = false,
  frameStyle,
  frameTestID,
  contentStyle,
  contentTestID,
  children,
  frameFooter,
  frameLightingOverlay,
  hoverProps = {},
  localEditorialDualLayer = false,
  localEditorialFit = LOCAL_BRIGHT_HERO_FULLBLEED_COVER_FIT,
}: VionaDynamicHeroWebNormalCleanProps): ReactElement {
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const preset = getWebNormalVariantPreset(universe, designVariant);
  const effective = resolveEffectiveHeroSource(universe, preset, source, sourceFilename);
  const pos = objectPosition ?? preset.objectPosition;
  const imgScale = scale ?? preset.scale;
  const useLocalEditorialDualLayer = localEditorialDualLayer && universe === 'local';
  const editorialFit = localEditorialFit;
  const coverPos = useLocalEditorialDualLayer
    ? (objectPosition ?? LOCAL_BRIGHT_REAL_CITY_HERO_FIT.objectPosition)
    : pos;
  const frameHeightPx = resolveWebNormalCleanFrameHeightForPreset(
    preset,
    viewportWidth,
    viewportHeight
  );
  const heightStyle = webNormalVariantFrameStyle(preset, viewportWidth, viewportHeight);
  const showPack62fBadge = readPack62fBadgeFromUrl();
  const imageTestID =
    universe === 'local' ? 'local-dynamic-hero-foreground-image' : 'travel-dynamic-hero-foreground-image';
  const clipTestID =
    universe === 'local' ? 'local-dynamic-hero-image-clip' : 'travel-dynamic-hero-image-clip';

  const overlay = overlayEnabled
    ? {
        widthPercent: universe === 'local' ? 36 : 34,
        peak: universe === 'local' ? 0.12 : 0.1,
        mid: universe === 'local' ? 0.12 * 0.48 : 0.1 * 0.45,
        locations: universe === 'local' ? ([0, 0.38, 0.52] as const) : ([0, 0.35, 0.5] as const),
      }
    : null;

  const webDataSet =
    Platform.OS === 'web'
      ? ({
          cleanComponentActive: 'true',
          heroAssetMode,
          heroSourceFile: effective.filename,
          designVariant: preset.variant,
          assetLane: preset.assetLane,
          pack62e: 'true',
          pack62fPlainLock: 'active',
          frameHeightPx: String(frameHeightPx),
          heroScale: String(imgScale),
          heroObjectPosition: pos,
          localEditorialDualLayer: useLocalEditorialDualLayer ? 'true' : 'false',
          heroDisplayMode: 'fullBleedCover',
          heroForegroundFit: 'cover',
          heroForegroundScale: useLocalEditorialDualLayer
            ? String(editorialFit.foregroundScale)
            : String(imgScale),
          heroBackdropBlur: String(editorialFit.backdropBlurPx),
          heroBackdropBrightness: String(editorialFit.backdropBrightness),
        } as const)
      : undefined;

  const frameBody = (
    <View
      testID={frameTestID}
      style={[styles.frame, frameStyle, heightStyle]}
      {...hoverProps}
      {...(Platform.OS === 'web' && webDataSet
        ? ({
            dataSet: {
              designVariant: preset.variant,
              frameHeightPx: String(frameHeightPx),
              assetLane: preset.assetLane,
            },
          } as const)
        : null)}
    >
      <View testID={clipTestID} style={styles.imageClip} pointerEvents="none">
        {useLocalEditorialDualLayer ? (
          <>
            <Image
              testID={`${imageTestID}-backdrop`}
              source={effective.source}
              resizeMode="cover"
              style={webNormalLocalEditorialBackdropStyle(coverPos, editorialFit)}
              accessibilityIgnoresInvertColors
            />
            <Image
              testID={imageTestID}
              source={effective.source}
              resizeMode="cover"
              style={webNormalLocalEditorialForegroundStyle(coverPos, editorialFit)}
              accessibilityIgnoresInvertColors
              {...(Platform.OS === 'web' && effective.filename
                ? ({
                    dataSet: {
                      heroSourceFile: effective.filename,
                      heroForegroundFit: 'cover',
                      heroDisplayMode: 'fullBleedCover',
                    },
                  } as const)
                : null)}
            />
          </>
        ) : (
          <Image
            testID={imageTestID}
            source={effective.source}
            resizeMode="cover"
            style={webNormalCleanImageStyle(pos, imgScale)}
            accessibilityIgnoresInvertColors
            {...(Platform.OS === 'web' && effective.filename
              ? ({ dataSet: { heroSourceFile: effective.filename } } as const)
              : null)}
          />
        )}
      </View>

      {preset.edgeVignette ? <EdgeVignetteLayer subtle={preset.variant === 'C'} /> : null}

      {frameLightingOverlay ? (
        <View pointerEvents="none" style={styles.lightingOverlay}>
          {frameLightingOverlay}
        </View>
      ) : null}

      {useLocalEditorialDualLayer ? (
        <LinearGradient
          pointerEvents="none"
          colors={[
            'rgba(2, 10, 16, 0.58)',
            'rgba(2, 10, 16, 0.34)',
            'rgba(2, 10, 16, 0.10)',
            'rgba(2, 10, 16, 0)',
          ]}
          locations={[0, 0.38, 0.62, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.localLeftTextScrim}
        />
      ) : null}

      {overlay ? (
        <LinearGradient
          pointerEvents="none"
          colors={[
            `rgba(4, 7, 12, ${overlay.peak.toFixed(2)})`,
            `rgba(4, 7, 12, ${overlay.mid.toFixed(2)})`,
            'rgba(4, 7, 12, 0)',
          ]}
          locations={[...overlay.locations]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[styles.textOverlay, { width: `${overlay.widthPercent}%` }]}
        />
      ) : null}

      {children ? (
        <View
          testID={
            contentTestID ??
            (universe === 'local' ? 'local-hero-editorial-text-layer' : 'travel-hero-editorial-text-layer')
          }
          pointerEvents="box-none"
          style={[styles.contentLayer, contentStyle]}
        >
          {children}
        </View>
      ) : null}

      {showPack62fBadge ? (
        <View testID="pack-62f-plain-badge" style={styles.pack62fBadge} pointerEvents="none">
          <Text style={styles.pack62fBadgeText}>62F PLAIN ACTIVE</Text>
        </View>
      ) : null}

      {frameFooter}

      <View
        pointerEvents="none"
        style={[
          styles.heroCrispEdge,
          premiumFrameEdgeOverlay(vionaTokens.radius.xxl),
          premiumCrispEdgeStroke(WEB_NORMAL_HERO_CRISP_BORDER[universe]),
        ]}
      />
    </View>
  );

  return (
    <View
      testID="viona-web-normal-clean-hero"
      style={[styles.root, universe === 'travel' ? styles.rootTravelFill : null]}
      {...(webDataSet ? ({ dataSet: webDataSet } as const) : null)}
    >
      {universe === 'travel' ? (
        <View
          testID="travel-dynamic-hero-stage"
          style={styles.stageFill}
          {...(webDataSet ? ({ dataSet: webDataSet } as const) : null)}
        >
          {frameBody}
        </View>
      ) : (
        frameBody
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  rootTravelFill: {
    ...StyleSheet.absoluteFillObject,
  },
  frame: {
    width: '100%',
    borderRadius: vionaTokens.radius.xxl,
    overflow: 'hidden',
    backgroundColor: '#020813',
    position: 'relative',
  },
  imageClip: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  edgeVignetteLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '38%',
    zIndex: 1,
  },
  edgeVignetteTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '18%',
    zIndex: 1,
  },
  edgeVignetteBottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '14%',
    zIndex: 1,
  },
  textOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  /** Pack 62LOCALBRIGHT_TEXT_HOVER — localized left text scrim (Local web-normal only). */
  localLeftTextScrim: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '62%',
    zIndex: 2,
  },
  contentLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
  },
  lightingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  heroCrispEdge: {
    zIndex: 6,
  },
  stageFill: {
    width: '100%',
    height: '100%',
  },
  pack62fBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 99,
    backgroundColor: '#c62828',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pack62fBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
