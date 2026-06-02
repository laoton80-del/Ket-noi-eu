/**
 * Local dynamic hero — Home hero grammar (copy left, visual right, no in-hero tiles).
 * Theme-invariant premium dark-glass frame; hero images stay daylight/golden-hour assets.
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactElement } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ImageStyle,
} from 'react-native';

import { vionaTokens } from '../../../design';
import { getLocalHeroAsset, type LocalHeroVisualKey } from '../../../design/vionaLocalHeroAssets';
import { getLocalHeroVisualSpec } from '../../../design/vionaLocalHeroVisuals';
import { FASHION_HOME_DESKTOP_MIN_WIDTH } from '../../../navigation/fashionHomeDesktopShell';
import {
  FASHION_HOME_FRAME_BORDER,
  FASHION_HOME_WEB_OPENING_STAGE_HERO_MAX_PX,
  FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX,
  premiumCrispEdgeStroke,
  premiumFrameEdgeOverlay,
} from '../fashionHomeDesktopShell';
import { LocalLightingNetworkEdge } from './LocalLightingNetworkEdge';
import { LocalHeroNetworkPulse } from './LocalHeroNetworkPulse';
import { FontFamily } from '../../../theme/typography';
import { useTranslation } from '../../../i18n';

/** Web desktop pointer (hover + fine pointer) — gates the hover animation off touch devices. */
function detectHoverPointer(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return false;
  try {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  } catch {
    return false;
  }
}

/**
 * Frame ratio for the dynamic hero banner. The delivered daylight assets are 1600x520
 * (`cover` keeps the image inside the frame); the frame is intentionally taller than the
 * asset (~1600/624) for Home-like cinematic depth. This adds only a small, even crop — no
 * zoom transform and no negative inset — while preserving width-driven aspectRatio behavior.
 */
const HERO_ASPECT = 1600 / 624;
/** Desktop max lift so hero visual mass stays premium after the flagship kicker band. */
export const LOCAL_HERO_LABEL_AWARE_MAX_BONUS_PX = 10;

/** Editorial recompose — left-to-center cover layout (wave3b.dynamic-hero-editorial-recompose). */
const LOCAL_HERO_DESKTOP_TITLE_MIN_WIDTH = 1024;
const LOCAL_HERO_LARGE_DESKTOP_MIN_WIDTH = 1366;

type LocalHeroEditorialLayout = Readonly<{
  zoneWidthPx: number;
  zoneWidthPercent: number;
  zoneWidthVw: number;
  zoneMinWidthPx: number;
  zoneLeftInsetPercent: number;
  titleMaxWidthPx: number;
  subtitleMaxWidthPx: number;
  metaRowMaxWidthPx: number;
  leftScrimWidthPercent: number;
  leftScrimMaxWidthPx: number;
  useAbsoluteLayer: boolean;
}>;

function localHeroLineHeight(fontSize: number, ratio: number): number {
  return Math.round(fontSize * ratio);
}

function localHeroKickerLetterSpacingPx(fontSize: number, em = 0.15): number {
  return Math.round(fontSize * em * 10) / 10;
}

/** Numeric editorial wrapper width — no CSS clamp (RN Web unreliable). */
function localHeroEditorialWrapperWidthPx(viewportWidth: number, largeDesktop: boolean): number {
  if (largeDesktop) {
    return Math.min(1160, Math.max(1020, Math.round(viewportWidth * 0.66)));
  }
  if (viewportWidth >= LOCAL_HERO_DESKTOP_TITLE_MIN_WIDTH) {
    return Math.min(820, Math.max(680, Math.round(viewportWidth * 0.54)));
  }
  return Math.min(560, Math.max(440, Math.round(viewportWidth * 0.72)));
}

/** Local cover zone — wide editorial block spanning left-to-center (numeric px width). */
function localHeroEditorialRecomposeLayout(
  viewportWidth: number,
  largeDesktop: boolean,
  desktopWebHero: boolean
): LocalHeroEditorialLayout {
  const useAbsoluteLayer = desktopWebHero && Platform.OS === 'web';
  const wrapperWidthPx = localHeroEditorialWrapperWidthPx(viewportWidth, largeDesktop);
  if (largeDesktop) {
    return {
      zoneWidthPx: wrapperWidthPx,
      zoneWidthPercent: 64,
      zoneWidthVw: 0,
      zoneMinWidthPx: wrapperWidthPx,
      zoneLeftInsetPercent: 3,
      titleMaxWidthPx: wrapperWidthPx,
      subtitleMaxWidthPx: Math.min(wrapperWidthPx, 920),
      metaRowMaxWidthPx: wrapperWidthPx,
      leftScrimWidthPercent: 68,
      leftScrimMaxWidthPx: wrapperWidthPx + 40,
      useAbsoluteLayer,
    };
  }
  if (viewportWidth >= LOCAL_HERO_DESKTOP_TITLE_MIN_WIDTH) {
    return {
      zoneWidthPx: wrapperWidthPx,
      zoneWidthPercent: 56,
      zoneWidthVw: 0,
      zoneMinWidthPx: wrapperWidthPx,
      zoneLeftInsetPercent: 3,
      titleMaxWidthPx: wrapperWidthPx,
      subtitleMaxWidthPx: Math.min(wrapperWidthPx, 780),
      metaRowMaxWidthPx: wrapperWidthPx,
      leftScrimWidthPercent: 58,
      leftScrimMaxWidthPx: wrapperWidthPx + 40,
      useAbsoluteLayer,
    };
  }
  const zoneWidthPx = Math.min(560, Math.max(440, Math.round(viewportWidth * 0.72)));
  return {
    zoneWidthPx,
    zoneWidthPercent: 76,
    zoneWidthVw: 0,
    zoneMinWidthPx: 0,
    zoneLeftInsetPercent: 0,
    titleMaxWidthPx: zoneWidthPx,
    subtitleMaxWidthPx: zoneWidthPx,
    metaRowMaxWidthPx: zoneWidthPx,
    leftScrimWidthPercent: 82,
    leftScrimMaxWidthPx: zoneWidthPx + 48,
    useAbsoluteLayer: false,
  };
}

function localHeroTitleDesktopOneLineStyle(widthPx: number, titleSize: number): Record<string, unknown> {
  const lineHeightPx = localHeroLineHeight(titleSize, 1.14);
  return {
    width: widthPx,
    maxWidth: widthPx,
    minWidth: widthPx,
    alignSelf: 'flex-start',
    flexShrink: 0,
    flexWrap: 'nowrap',
    letterSpacing: -0.72,
    fontSize: titleSize,
    lineHeight: lineHeightPx,
    overflow: 'visible',
    ...(Platform.OS === 'web'
      ? {
          display: 'block',
          whiteSpace: 'nowrap',
          wordBreak: 'keep-all',
          overflowWrap: 'normal',
          textOverflow: 'clip',
        }
      : null),
  };
}

/** RN Web can ignore Text whiteSpace — force true one-line on the DOM node. */
function useLocalHeroTitleVisualOneLineDomForce(
  enabled: boolean,
  widthPx: number,
  titleSize: number,
  headline: string
): void {
  useLayoutEffect(() => {
    if (Platform.OS !== 'web' || !enabled || typeof document === 'undefined') return;

    const lineHeightPx = localHeroLineHeight(titleSize, 1.14);
    const apply = (): boolean => {
      const el = document.querySelector('[data-testid="local-hero-title"]') as HTMLElement | null;
      if (!el) return false;
      el.style.setProperty('white-space', 'nowrap', 'important');
      el.style.setProperty('overflow', 'visible', 'important');
      el.style.setProperty('text-overflow', 'clip', 'important');
      el.style.setProperty('word-break', 'keep-all', 'important');
      el.style.setProperty('overflow-wrap', 'normal', 'important');
      el.style.setProperty('display', 'block', 'important');
      el.style.setProperty('width', `${widthPx}px`, 'important');
      el.style.setProperty('max-width', `${widthPx}px`, 'important');
      el.style.setProperty('min-width', `${widthPx}px`, 'important');
      el.style.setProperty('font-size', `${titleSize}px`, 'important');
      el.style.setProperty('line-height', `${lineHeightPx}px`, 'important');
      el.style.setProperty('font-weight', '900', 'important');
      return true;
    };

    if (apply()) return;
    const frame = requestAnimationFrame(() => {
      apply();
    });
    return () => cancelAnimationFrame(frame);
  }, [enabled, widthPx, titleSize, headline]);
}

const LOCAL_HERO_TYPOGRAPHY = {
  eyebrow: { fontSize: 14, letterSpacingEm: 0.15 },
  titleDesktop: { fontSize: 40, lineHeightRatio: 1.14 },
  titleLargeDesktop: { fontSize: 34, lineHeightRatio: 1.14 },
  titleTablet: { fontSize: 38, lineHeightRatio: 1.14 },
  titleMobile: { fontSize: 29, lineHeightRatio: 1.16 },
  titleCompact: { fontSize: 29, lineHeightRatio: 1.16 },
  subtitleDesktop: { fontSize: 21, lineHeightRatio: 1.5 },
  subtitleLargeDesktop: { fontSize: 21, lineHeightRatio: 1.5 },
  subtitleTablet: { fontSize: 18, lineHeightRatio: 1.48 },
  subtitleMobile: { fontSize: 16, lineHeightRatio: 1.5 },
  subtitleCompact: { fontSize: 16, lineHeightRatio: 1.5 },
  spacingDesktop: { kickerToTitle: 18, titleToSubtitle: 24, subtitleToMeta: 28, metaToTrust: 18 },
  spacingTablet: { kickerToTitle: 16, titleToSubtitle: 18, subtitleToMeta: 22, metaToTrust: 14 },
  spacingMobile: { kickerToTitle: 14, titleToSubtitle: 16, subtitleToMeta: 20, metaToTrust: 12 },
} as const;

function localDynamicHeroCopyMetrics(
  viewportWidth: number,
  compactHero: boolean,
  _isWebFullscreen: boolean
): Readonly<{
  eyebrowSize: number;
  eyebrowLetterSpacing: number;
  eyebrowMarginBottom: number;
  titleSize: number;
  titleLineHeight: number;
  titleMarginBottom: number;
  titleMaxWidth: number;
  subtitleSize: number;
  subtitleLineHeight: number;
  subtitleMarginBottom: number;
  subtitleMaxWidth: number;
  textStackMaxWidth: number;
  textStackWidthPx: number;
  textStackWidthPercent: number;
  textStackWidthVw: number;
  textStackLeftInsetPercent: number;
  textStackMinWidthPx: number;
  metaRowMaxWidth: number;
  metaToTrustMargin: number;
  leftScrimWidthPercent: number;
  leftScrimMaxWidth: number;
  titleNoWrap: boolean;
  titleSingleLineDesktop: boolean;
  trustNoWrap: boolean;
  useAbsoluteTextLayer: boolean;
}> {
  const typo = LOCAL_HERO_TYPOGRAPHY;
  const kickerLetterSpacing = localHeroKickerLetterSpacingPx(
    typo.eyebrow.fontSize,
    typo.eyebrow.letterSpacingEm
  );

  if (compactHero) {
    const title = typo.titleCompact;
    const sub = typo.subtitleCompact;
    const space = typo.spacingMobile;
    const stackWidth = Math.min(360, Math.max(280, Math.round(viewportWidth * 0.82)));
    return {
      eyebrowSize: typo.eyebrow.fontSize,
      eyebrowLetterSpacing: kickerLetterSpacing,
      eyebrowMarginBottom: space.kickerToTitle,
      titleSize: title.fontSize,
      titleLineHeight: localHeroLineHeight(title.fontSize, title.lineHeightRatio),
      titleMarginBottom: space.titleToSubtitle,
      titleMaxWidth: stackWidth,
      subtitleSize: sub.fontSize,
      subtitleLineHeight: localHeroLineHeight(sub.fontSize, sub.lineHeightRatio),
      subtitleMarginBottom: space.subtitleToMeta,
      subtitleMaxWidth: stackWidth,
      textStackMaxWidth: stackWidth,
      textStackWidthPx: stackWidth,
      textStackWidthPercent: 92,
      textStackWidthVw: 0,
      textStackLeftInsetPercent: 0,
      textStackMinWidthPx: 0,
      metaRowMaxWidth: stackWidth,
      metaToTrustMargin: space.metaToTrust,
      leftScrimWidthPercent: 88,
      leftScrimMaxWidth: stackWidth + 48,
      titleNoWrap: false,
      titleSingleLineDesktop: false,
      trustNoWrap: false,
      useAbsoluteTextLayer: false,
    };
  }
  if (viewportWidth >= LOCAL_HERO_DESKTOP_TITLE_MIN_WIDTH) {
    const largeDesktop = viewportWidth >= LOCAL_HERO_LARGE_DESKTOP_MIN_WIDTH;
    const title = largeDesktop ? typo.titleLargeDesktop : typo.titleDesktop;
    const sub = largeDesktop ? typo.subtitleLargeDesktop : typo.subtitleDesktop;
    const space = typo.spacingDesktop;
    const desktopWebHero =
      Platform.OS === 'web' && viewportWidth >= FASHION_HOME_DESKTOP_MIN_WIDTH && !compactHero;
    const editorial = localHeroEditorialRecomposeLayout(viewportWidth, largeDesktop, desktopWebHero);
    return {
      eyebrowSize: typo.eyebrow.fontSize,
      eyebrowLetterSpacing: kickerLetterSpacing,
      eyebrowMarginBottom: space.kickerToTitle,
      titleSize: title.fontSize,
      titleLineHeight: localHeroLineHeight(title.fontSize, title.lineHeightRatio),
      titleMarginBottom: space.titleToSubtitle,
      titleMaxWidth: editorial.titleMaxWidthPx,
      subtitleSize: sub.fontSize,
      subtitleLineHeight: localHeroLineHeight(sub.fontSize, sub.lineHeightRatio),
      subtitleMarginBottom: space.subtitleToMeta,
      subtitleMaxWidth: editorial.subtitleMaxWidthPx,
      textStackMaxWidth: editorial.zoneWidthPx,
      textStackWidthPx: editorial.zoneWidthPx,
      textStackWidthPercent: editorial.zoneWidthPercent,
      textStackWidthVw: editorial.zoneWidthVw,
      textStackLeftInsetPercent: editorial.zoneLeftInsetPercent,
      textStackMinWidthPx: editorial.zoneMinWidthPx,
      metaRowMaxWidth: editorial.metaRowMaxWidthPx,
      metaToTrustMargin: space.metaToTrust,
      leftScrimWidthPercent: editorial.leftScrimWidthPercent,
      leftScrimMaxWidth: editorial.leftScrimMaxWidthPx,
      titleNoWrap: false,
      titleSingleLineDesktop: largeDesktop && editorial.useAbsoluteLayer,
      trustNoWrap: true,
      useAbsoluteTextLayer: editorial.useAbsoluteLayer,
    };
  }
  if (viewportWidth < 768) {
    const title = typo.titleMobile;
    const sub = typo.subtitleMobile;
    const space = typo.spacingMobile;
    const stackWidth = Math.min(360, Math.max(300, Math.round(viewportWidth * 0.88)));
    return {
      eyebrowSize: typo.eyebrow.fontSize,
      eyebrowLetterSpacing: kickerLetterSpacing,
      eyebrowMarginBottom: space.kickerToTitle,
      titleSize: title.fontSize,
      titleLineHeight: localHeroLineHeight(title.fontSize, title.lineHeightRatio),
      titleMarginBottom: space.titleToSubtitle,
      titleMaxWidth: stackWidth,
      subtitleSize: sub.fontSize,
      subtitleLineHeight: localHeroLineHeight(sub.fontSize, sub.lineHeightRatio),
      subtitleMarginBottom: space.subtitleToMeta,
      subtitleMaxWidth: stackWidth,
      textStackMaxWidth: stackWidth,
      textStackWidthPx: stackWidth,
      textStackWidthPercent: 90,
      textStackWidthVw: 0,
      textStackLeftInsetPercent: 0,
      textStackMinWidthPx: 0,
      metaRowMaxWidth: stackWidth,
      metaToTrustMargin: space.metaToTrust,
      leftScrimWidthPercent: 86,
      leftScrimMaxWidth: stackWidth + 40,
      titleNoWrap: false,
      titleSingleLineDesktop: false,
      trustNoWrap: false,
      useAbsoluteTextLayer: false,
    };
  }
  const title = typo.titleTablet;
  const sub = typo.subtitleTablet;
  const space = typo.spacingTablet;
  const stackWidth = Math.min(560, Math.max(440, Math.round(viewportWidth * 0.72)));
  return {
    eyebrowSize: typo.eyebrow.fontSize,
    eyebrowLetterSpacing: kickerLetterSpacing,
    eyebrowMarginBottom: space.kickerToTitle,
    titleSize: title.fontSize,
    titleLineHeight: localHeroLineHeight(title.fontSize, title.lineHeightRatio),
    titleMarginBottom: space.titleToSubtitle,
    titleMaxWidth: stackWidth,
    subtitleSize: sub.fontSize,
    subtitleLineHeight: localHeroLineHeight(sub.fontSize, sub.lineHeightRatio),
    subtitleMarginBottom: space.subtitleToMeta,
    subtitleMaxWidth: stackWidth,
    textStackMaxWidth: stackWidth,
    textStackWidthPx: stackWidth,
    textStackWidthPercent: 76,
    textStackWidthVw: 0,
    textStackLeftInsetPercent: 0,
    textStackMinWidthPx: 0,
    metaRowMaxWidth: stackWidth,
    metaToTrustMargin: space.metaToTrust,
    leftScrimWidthPercent: 80,
    leftScrimMaxWidth: stackWidth + 48,
    titleNoWrap: false,
    titleSingleLineDesktop: false,
    trustNoWrap: false,
    useAbsoluteTextLayer: false,
  };
}

function useWebFullscreenActive(): boolean {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const sync = () => setActive(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    sync();
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  return active;
}

export type LocalDynamicHeroProps = Readonly<{
  onBrowseServices: () => void;
  onBookingAssist: () => void;
  activeHeroKey?: LocalHeroVisualKey;
  /** Viewport-budget hero cap from opening-stage first-view lock (desktop web). */
  openingStageHeroMaxPx?: number;
  /** @deprecated Ignored — Local hero uses theme-invariant premium dark glass. */
  daylight?: boolean;
  testID?: string;
}>;

export function LocalDynamicHero({
  onBrowseServices,
  onBookingAssist,
  activeHeroKey = 'default',
  openingStageHeroMaxPx,
  testID = 'local-dynamic-hero',
}: LocalDynamicHeroProps): ReactElement {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const isNarrow = width < 520;
  const shortViewport = height > 0 && height < 520;
  const compactHero = shortViewport || (height > 0 && width / height > 1.8);
  const isWebFullscreen = useWebFullscreenActive();
  const heroCopy = useMemo(
    () => localDynamicHeroCopyMetrics(width, compactHero, isWebFullscreen),
    [width, compactHero, isWebFullscreen]
  );
  const localHeroHeadline = t('localHub.reframe.heroHeadline');
  useLocalHeroTitleVisualOneLineDomForce(
    heroCopy.titleSingleLineDesktop,
    heroCopy.textStackWidthPx,
    heroCopy.titleSize,
    localHeroHeadline
  );
  const desktopWebHero =
    Platform.OS === 'web' && width >= FASHION_HOME_DESKTOP_MIN_WIDTH && !compactHero;
  // Width-driven aspectRatio + Home opening-stage floors/caps on desktop web; moderate tablet lift;
  // minimal mobile bump so copy stays readable without pushing For You off-screen.
  const frameSizing = useMemo(() => {
    if (compactHero) {
      return { aspectRatio: HERO_ASPECT, minHeight: 202, maxHeight: 356 } as const;
    }
    if (desktopWebHero) {
      const heroCap =
        openingStageHeroMaxPx ??
        FASHION_HOME_WEB_OPENING_STAGE_HERO_MAX_PX + LOCAL_HERO_LABEL_AWARE_MAX_BONUS_PX;
      /** When the opening-stage lock caps hero height, min must not exceed max (RN keeps min otherwise). */
      const heroMin =
        openingStageHeroMaxPx != null
          ? Math.min(FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX, heroCap)
          : FASHION_HOME_WEB_OPENING_STAGE_HERO_MIN_PX;
      return {
        aspectRatio: HERO_ASPECT,
        minHeight: heroMin,
        maxHeight: heroCap,
      } as const;
    }
    if (isNarrow) {
      return { aspectRatio: HERO_ASPECT, minHeight: 236, maxHeight: 368 } as const;
    }
    return { aspectRatio: HERO_ASPECT, minHeight: 320, maxHeight: 432 } as const;
  }, [compactHero, desktopWebHero, isNarrow, openingStageHeroMaxPx]);
  const visual = getLocalHeroVisualSpec(activeHeroKey);
  const heroSource = getLocalHeroAsset(activeHeroKey);
  const fallbackHeroSource = getLocalHeroAsset('default');
  const previousSourceRef = useRef(heroSource);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const supportsHover = useMemo(detectHoverPointer, []);
  const [hovered, setHovered] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const hoverAnim = useRef(new Animated.Value(0)).current;

  // The hero "lights up" for either of two pointer-driven reasons:
  //  1. The user hovers the hero frame directly (`hovered`), or
  //  2. The user hovers one of the four hero cards, which swaps `activeHeroKey` to a non-default
  //     state (the image + semantic accent change). Previously the pulse only keyed off `hovered`,
  //     so card-driven states swapped the image but never animated — making the pulse appear to
  //     "only work for the default hero". Treating a non-default `activeHeroKey` as an active state
  //     drives the network boost + pulse + rim in that state's own accent.
  const cardActive = activeHeroKey !== 'default';
  const heroLit = (hovered || cardActive) && supportsHover;

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((value) => {
        if (mounted) setReduceMotion(Boolean(value));
      })
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (value: boolean) =>
      setReduceMotion(Boolean(value))
    );
    return () => {
      mounted = false;
      sub?.remove?.();
    };
  }, []);

  useEffect(() => {
    Animated.timing(hoverAnim, {
      toValue: heroLit ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [heroLit, hoverAnim]);

  const hoverProps = supportsHover
    ? ({
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      } as const)
    : {};
  const washOpacity = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.05] });
  const rimOpacity = hoverAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });

  useEffect(() => {
    if (previousSourceRef.current === heroSource) return;
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start();
    previousSourceRef.current = heroSource;
  }, [fadeAnim, heroSource]);

  const imageWebStyle = useMemo(
    () =>
      (Platform.OS === 'web'
        ? {
            width: '100%',
            height: '100%',
            objectFit: 'cover' as const,
            objectPosition: visual.preferredObjectPosition,
          }
        : {}) as ImageStyle,
    [visual.preferredObjectPosition]
  );
  const scrimStrength = Math.max(0.44, Math.min(0.72, visual.textScrimStrength));

  return (
    <View testID={testID} style={styles.shell}>
      <View style={[styles.frame, frameSizing]} {...hoverProps}>
        <LinearGradient
          pointerEvents="none"
          colors={[
            `rgba(4, 7, 12, ${scrimStrength.toFixed(2)})`,
            `rgba(4, 7, 12, ${(scrimStrength * 0.42).toFixed(2)})`,
            'rgba(4, 7, 12, 0)',
          ]}
          locations={[0, 0.48, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[
            styles.leftScrim,
            {
              width: `${heroCopy.leftScrimWidthPercent}%`,
              maxWidth: heroCopy.leftScrimMaxWidth,
            },
          ]}
        />
        <View style={styles.imageClip} pointerEvents="none">
          <Image
            source={fallbackHeroSource}
            resizeMode="cover"
            style={[styles.imageFill, imageWebStyle]}
            accessibilityIgnoresInvertColors
          />
          <Animated.View style={[styles.imageFadeLayer, { opacity: fadeAnim }]}>
            <Image
              source={heroSource}
              resizeMode="cover"
              style={[styles.imageFill, imageWebStyle]}
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
          <LinearGradient
            pointerEvents="none"
            colors={['transparent', 'rgba(4, 6, 10, 0.26)']}
            style={styles.bottomHandoff}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.imageBrightenWash, { opacity: washOpacity }]}
          />
        </View>
        <View pointerEvents="none" style={styles.networkLayer}>
          <LocalLightingNetworkEdge
            accent={visual.accent}
            secondaryAccent={visual.secondaryAccent}
            tier="hero"
            boosted={heroLit}
            radius={vionaTokens.radius.xxl}
          />
          <LocalHeroNetworkPulse
            accent={visual.accent}
            secondaryAccent={visual.secondaryAccent}
            active={heroLit}
            reducedMotion={reduceMotion}
          />
        </View>
        <View
          testID="local-hero-editorial-text-layer"
          style={[
            heroCopy.useAbsoluteTextLayer ? styles.editorialCopyCol : styles.copyCol,
            heroCopy.useAbsoluteTextLayer
              ? {
                  left: `${heroCopy.textStackLeftInsetPercent}%`,
                  width: heroCopy.textStackWidthPx,
                  maxWidth: heroCopy.textStackWidthPx,
                }
              : {
                  width: `${heroCopy.textStackWidthPercent}%`,
                  maxWidth: heroCopy.textStackMaxWidth,
                },
          ]}
          pointerEvents="box-none"
        >
          <Text
            style={[
              styles.eyebrow,
              {
                fontSize: heroCopy.eyebrowSize,
                letterSpacing: heroCopy.eyebrowLetterSpacing,
                marginBottom: heroCopy.eyebrowMarginBottom,
                ...(heroCopy.useAbsoluteTextLayer
                  ? { width: heroCopy.textStackWidthPx }
                  : null),
              },
            ]}
          >
            {t('localHub.reframe.heroEyebrow')}
          </Text>
          <Text
            testID="local-hero-title"
            style={[
              styles.headline,
              {
                marginBottom: heroCopy.titleMarginBottom,
                ...(Platform.OS === 'web' ? ({ fontWeight: '900' } as const) : null),
                ...(heroCopy.useAbsoluteTextLayer
                  ? heroCopy.titleSingleLineDesktop
                    ? localHeroTitleDesktopOneLineStyle(
                        heroCopy.textStackWidthPx,
                        heroCopy.titleSize
                      )
                    : {
                        fontSize: heroCopy.titleSize,
                        lineHeight: heroCopy.titleLineHeight,
                        width: heroCopy.textStackWidthPx,
                        maxWidth: heroCopy.textStackWidthPx,
                        alignSelf: 'flex-start' as const,
                        flexShrink: 0,
                      }
                  : {
                      fontSize: heroCopy.titleSize,
                      lineHeight: heroCopy.titleLineHeight,
                      maxWidth: heroCopy.titleMaxWidth,
                    }),
              },
            ]}
          >
            {localHeroHeadline}
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                fontSize: heroCopy.subtitleSize,
                lineHeight: heroCopy.subtitleLineHeight,
                marginBottom: heroCopy.subtitleMarginBottom,
                ...(heroCopy.useAbsoluteTextLayer
                  ? {
                      width: heroCopy.textStackWidthPx,
                      maxWidth: heroCopy.textStackWidthPx,
                      alignSelf: 'flex-start' as const,
                      flexShrink: 0,
                    }
                  : { maxWidth: heroCopy.subtitleMaxWidth }),
              },
            ]}
          >
            {t('localHub.reframe.heroSubtitle')}
          </Text>
          <View
            style={[
              styles.ctaRow,
              heroCopy.useAbsoluteTextLayer
                ? {
                    width: heroCopy.textStackWidthPx,
                    maxWidth: heroCopy.textStackWidthPx,
                    marginBottom: 0,
                    flexShrink: 0,
                    alignSelf: 'flex-start' as const,
                  }
                : null,
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('localHub.reframe.heroCtaBrowse')}
              onPress={onBrowseServices}
              style={({ pressed }) => [styles.ctaPrimary, pressed && styles.ctaPressed]}
            >
              <LinearGradient
                colors={['rgba(255, 232, 188, 0.98)', 'rgba(201, 169, 98, 0.98)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.ctaPrimaryFill}
              >
                <Text style={styles.ctaPrimaryText}>{t('localHub.reframe.heroCtaBrowse')}</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('localHub.reframe.heroCtaBookingAssist')}
              onPress={onBookingAssist}
              style={({ pressed }) => [styles.ctaSecondary, pressed && styles.ctaPressed]}
            >
              <Text style={styles.ctaSecondaryText}>{t('localHub.reframe.heroCtaBookingAssist')}</Text>
            </Pressable>
          </View>
          <View
            style={[
              styles.trustStrip,
              {
                width: heroCopy.useAbsoluteTextLayer ? heroCopy.textStackWidthPx : undefined,
                maxWidth: heroCopy.useAbsoluteTextLayer
                  ? heroCopy.textStackWidthPx
                  : heroCopy.textStackMaxWidth,
                marginTop: heroCopy.metaToTrustMargin,
                alignSelf: heroCopy.useAbsoluteTextLayer ? 'stretch' : undefined,
                flexWrap: heroCopy.trustNoWrap ? 'nowrap' : 'wrap',
              },
            ]}
          >
            <Text style={styles.trustText}>{t('localCommerce.safety.pillRequestOnly')}</Text>
            <View style={styles.trustDivider} />
            <Text style={styles.trustText}>{t('localCommerce.safety.pillNoPayment')}</Text>
            <View style={styles.trustDivider} />
            <Text style={styles.trustText}>{t('localHub.reframe.trustMerchantFirst')}</Text>
          </View>
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.edgeOverlay,
            premiumFrameEdgeOverlay(vionaTokens.radius.xxl),
            premiumCrispEdgeStroke(FASHION_HOME_FRAME_BORDER),
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[styles.hoverRim, { borderColor: visual.accent, opacity: rimOpacity }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    width: '100%',
    borderRadius: vionaTokens.radius.xxl,
    overflow: 'hidden',
  },
  frame: {
    width: '100%',
    borderRadius: vionaTokens.radius.xxl,
    overflow: 'hidden',
    backgroundColor: 'rgba(6, 10, 18, 0.92)',
    position: 'relative',
  },
  leftScrim: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  imageClip: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  imageFill: {
    ...StyleSheet.absoluteFillObject,
  },
  imageFadeLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  networkLayer: {
    // Above the image, below the copy (zIndex 4) and crisp frame (zIndex 5) so text + frame win.
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
  },
  imageBrightenWash: {
    // Very subtle hover "activation" — a faint white wash over the image only (behind copy), so the
    // hero reads as alive without over-brightening faces or hurting text legibility.
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  hoverRim: {
    // Hover-only accent rim glow on top of the crisp frame; fades out smoothly on hover-out.
    ...StyleSheet.absoluteFillObject,
    borderRadius: vionaTokens.radius.xxl,
    borderWidth: 1.5,
    zIndex: 6,
  },
  bottomHandoff: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '28%',
  },
  /** viona.wave3b.force-editorial-text-layer — flow stack (mobile/tablet). */
  copyCol: {
    zIndex: 4,
    paddingHorizontal: vionaTokens.spacing[20],
    paddingVertical: vionaTokens.spacing[20],
  },
  /** viona.wave3b.editorial-recompose — absolute cover overlay (desktop web). */
  editorialCopyCol: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 0,
  },
  eyebrow: {
    fontFamily: FontFamily.semibold,
    textTransform: 'uppercase',
    color: 'rgba(120, 255, 210, 0.92)',
  },
  headline: {
    fontFamily: FontFamily.extrabold,
    ...(Platform.OS === 'web' ? ({ fontWeight: '900' } as const) : null),
    color: '#FFFFFF',
    letterSpacing: -0.32,
    textShadowColor: 'rgba(3, 6, 12, 0.68)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  subtitle: {
    fontFamily: FontFamily.medium,
    color: 'rgba(236, 244, 255, 0.96)',
    textShadowColor: 'rgba(3, 6, 12, 0.42)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  ctaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: vionaTokens.spacing[8],
    marginTop: 0,
  },
  ctaPrimary: {
    borderRadius: vionaTokens.radius.md,
    overflow: 'hidden',
  },
  ctaPrimaryFill: {
    paddingHorizontal: vionaTokens.spacing[16],
    paddingVertical: vionaTokens.spacing[12],
  },
  ctaPrimaryText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: 'rgba(18, 24, 36, 0.96)',
  },
  ctaSecondary: {
    borderRadius: vionaTokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(120, 210, 255, 0.42)',
    backgroundColor: 'rgba(10, 18, 32, 0.72)',
    paddingHorizontal: vionaTokens.spacing[16],
    paddingVertical: vionaTokens.spacing[12],
    justifyContent: 'center',
  },
  ctaSecondaryText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: 'rgba(230, 244, 255, 0.96)',
  },
  ctaPressed: {
    opacity: 0.9,
  },
  trustStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 0,
    paddingVertical: vionaTokens.spacing[6],
    paddingHorizontal: vionaTokens.spacing[12],
    borderRadius: vionaTokens.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(120, 255, 210, 0.28)',
    backgroundColor: 'rgba(6, 12, 22, 0.62)',
    alignSelf: 'flex-start',
  },
  trustText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: 'rgba(248, 252, 255, 0.92)',
    flexShrink: 0,
  },
  trustDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(148, 163, 184, 0.35)',
  },
  edgeOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 5,
  },
});
