import { LinearGradient } from 'expo-linear-gradient';
// @ts-expect-error react-dom has no declaration file in this app
import { createPortal } from 'react-dom';
import { createElement, useEffect, useRef, useState } from 'react';
import { ResizeMode, Video, type AVPlaybackStatus } from 'expo-av';
import { Asset } from 'expo-asset';
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, type ImageStyle, type ViewStyle } from 'react-native';
import { Inter_500Medium, Inter_600SemiBold, useFonts } from '@expo-google-fonts/inter';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useTranslation } from '../../../i18n';
import { useFashionHomePrefersReducedMotion } from '../fashionHomeDesktopShell';
import { playIntroChime, stopIntroChime } from './introChime';

const EARTH = require('../../../../assets/brand/viona/intro/intro-earth.png');
const EARTH_VIDEO = require('../../../../assets/brand/viona/intro/intro-earth.mp4');
const CRANE = require('../../../../assets/brand/viona/viona-symbol-gold.png');
const CRANE_FRAME = 1024 / 712;
const EARTH_W = 1024;
const EARTH_H = 1536;
const LIMB_CX = 509.2;
const LIMB_CY = 1581.1;
const LIMB_R = 812.9;
const EARTH_ANCHOR_Y = 0.46;

function earthLimb(width: number, height: number) {
  const boxH = height * 0.78;
  const scale = Math.max(width / EARTH_W, boxH / EARTH_H);
  const dispW = EARTH_W * scale;
  const dispH = EARTH_H * scale;
  const cx = (width - dispW) / 2 + LIMB_CX * scale;
  const cy = height - boxH + (boxH - dispH) * EARTH_ANCHOR_Y + LIMB_CY * scale;
  const radius = LIMB_R * scale;
  const half = (Math.asin(Math.min(0.92, width / 2 / Math.max(radius, 1))) * 180) / Math.PI;
  return { cx, cy, radius, half };
}

function craneMaskStyle(): ViewStyle | null {
  if (Platform.OS !== 'web') return null;
  let uri = '';
  try {
    uri = Asset.fromModule(CRANE).uri ?? '';
  } catch {
    uri = '';
  }
  if (!uri) return null;
  const mask = `url("${uri.replace(/"/g, '')}")`;
  return {
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskSize: '100% 100%',
    maskSize: '100% 100%',
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    maskMode: 'alpha',
  } as ViewStyle;
}

const LIMB_PERIOD_MS = 7200;
const LIMB_SPOT_PX = 52;
const LIMB_PEAK_PX = 16;

function limbArcPath(cx: number, cy: number, radius: number, halfDeg: number) {
  const half = (halfDeg * Math.PI) / 180;
  const x1 = cx + radius * Math.sin(-half);
  const y1 = cy - radius * Math.cos(-half);
  const x2 = cx + radius * Math.sin(half);
  const y2 = cy - radius * Math.cos(half);
  const length = Math.max(1, radius * half * 2);
  const d = `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${radius.toFixed(1)} ${radius.toFixed(1)} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  return { d, length };
}

function ensureLimbMotion(length: number) {
  if (typeof document === 'undefined') return;
  const id = 'viona-limb-kf';
  let node = document.getElementById(id);
  if (!node) {
    node = document.createElement('style');
    node.id = id;
    document.head.appendChild(node);
  }
  const len = Math.max(1, Math.round(length));
  const bodyLead = Math.round((LIMB_SPOT_PX - 34) / 2);
  const peakLead = Math.round((LIMB_SPOT_PX - LIMB_PEAK_PX) / 2);
  node.textContent = `@keyframes vionaLimbSpot{from{stroke-dashoffset:0}to{stroke-dashoffset:-${len}}}@keyframes vionaLimbBody{from{stroke-dashoffset:${bodyLead}}to{stroke-dashoffset:${bodyLead - len}}}@keyframes vionaLimbPeak{from{stroke-dashoffset:${peakLead}}to{stroke-dashoffset:${peakLead - len}}}`;
}

function LimbComets({
  width,
  height,
  limb,
}: {
  width: number;
  height: number;
  limb: ReturnType<typeof earthLimb>;
}) {
  const inset = (limb.radius / LIMB_R) * 6;
  const arc = limbArcPath(limb.cx, limb.cy, Math.max(48, limb.radius - inset), Math.max(16, limb.half - 4));
  useEffect(() => {
    ensureLimbMotion(arc.length);
  }, [arc.length]);
  const dash = (mark: number) => `${mark} ${Math.max(1, arc.length - mark).toFixed(1)}`;
  const run = (name: string) => ({ animation: `${name} ${LIMB_PERIOD_MS}ms linear infinite` });
  const spot = (color: string, widthPx: number, opacity: number, mark: number, motion: string, glow: boolean) =>
    createElement('path', {
      d: arc.d,
      fill: 'none',
      stroke: color,
      strokeWidth: widthPx,
      strokeOpacity: opacity,
      strokeLinecap: 'round',
      strokeDasharray: dash(mark),
      filter: glow ? 'url(#vionaLimbGlow)' : undefined,
      style: run(motion),
    });
  return createElement(
    'svg',
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      style: { position: 'absolute', left: 0, top: 0, pointerEvents: 'none' },
    },
    createElement(
      'defs',
      null,
      createElement(
        'filter',
        { id: 'vionaLimbGlow', x: '-20%', y: '-80%', width: '140%', height: '260%' },
        createElement('feGaussianBlur', { stdDeviation: '0.7' }),
      ),
    ),
    spot('#00D1FF', 3, 0.45, LIMB_SPOT_PX, 'vionaLimbSpot', true),
    spot('#00D1FF', 2.5, 1, 34, 'vionaLimbBody', false),
    spot('#FFFFFF', 1.5, 1, LIMB_PEAK_PX, 'vionaLimbPeak', false),
  );
}

function readReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const HOLD_MS = 4000;
const REDUCED_HOLD_MS = 1000;
const FADE_MS = 250;

export function VionaIntroScreen({ onDone }: Readonly<{ onDone: () => void }>) {
  const reducedFromHook = useFashionHomePrefersReducedMotion();
  const reducedMotion = reducedFromHook || readReducedMotion();
  const [backdrop, setBackdrop] = useState<'poster' | 'video' | 'still'>(reducedMotion ? 'still' : 'poster');
  const backdropRef = useRef(backdrop);
  backdropRef.current = backdrop;
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const [fontsLoaded] = useFonts({ Inter_500Medium, Inter_600SemiBold });
  const desktop = width >= 1024;
  const markSize = desktop ? 200 : 140;
  const frame = Math.round(markSize * CRANE_FRAME);
  const wordSize = desktop ? 48 : 34;
  const clusterHeight = frame + wordSize + 110;
  const clusterTop = Math.max(16, height * 0.4 - clusterHeight / 2);
  const veil = useSharedValue(1);
  const logo = useSharedValue(reducedMotion ? 1 : 0);
  const lines = useSharedValue(reducedMotion ? 1 : 0);
  const trace = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) onDone();
    };
    if (reducedMotion) {
      logo.value = 1;
      lines.value = 1;
      trace.value = 0;
      const timer = setTimeout(finish, REDUCED_HOLD_MS);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    logo.value = withDelay(300, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    lines.value = withDelay(500, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    trace.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.linear }), -1, false);
    void playIntroChime(false);
    const timer = setTimeout(() => {
      veil.value = withTiming(0, { duration: FADE_MS }, (finished) => {
        if (finished) runOnJS(finish)();
      });
    }, HOLD_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [lines, logo, onDone, reducedMotion, trace, veil]);

  useEffect(() => {
    if (reducedMotion || backdrop !== 'poster') return;
    const timer = setTimeout(() => {
      if (backdropRef.current === 'poster') setBackdrop('still');
    }, 3500);
    return () => clearTimeout(timer);
  }, [backdrop, reducedMotion]);

  const onEarthStatus = (status: AVPlaybackStatus) => {
    if (backdropRef.current === 'still') return;
    if (!status.isLoaded) {
      if (status.error) setBackdrop('still');
      return;
    }
    if (status.isPlaying || status.positionMillis > 40) setBackdrop('video');
  };

  const limb = earthLimb(width, height);
  const logoMask = craneMaskStyle();
  const bandW = Math.max(22, Math.round(frame * 0.34));

  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: 0.96 + logo.value * 0.04 }],
  }));
  const linesStyle = useAnimatedStyle(() => ({ opacity: lines.value }));
  const traceStyle = useAnimatedStyle(() => {
    const edge = trace.value < 0.08 ? trace.value / 0.08 : trace.value > 0.92 ? (1 - trace.value) / 0.08 : 1;
    return {
      opacity: edge,
      transform: [{ translateX: -bandW + trace.value * (frame + bandW) }],
    };
  });
  const skip = () => {
    void stopIntroChime();
    if (reducedMotion) {
      onDone();
      return;
    }
    veil.value = withTiming(0, { duration: FADE_MS }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
  };

  const wordFont =
    Platform.OS === 'web'
      ? 'Inter_600SemiBold, Inter, system-ui, sans-serif'
      : fontsLoaded
        ? 'Inter_600SemiBold'
        : undefined;

  const scene = (
    <Animated.View style={[styles.fill, veilStyle]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Skip intro" onPress={skip} style={styles.fill}>
        <View style={styles.sky} />
        <Image
          source={EARTH}
          resizeMode="cover"
          onError={() => {
            if (backdrop !== 'video') onDone();
          }}
          style={[styles.earth, backdrop === 'video' ? styles.posterHidden : null]}
        />
        {backdrop !== 'still' ? (
          <Video
            source={EARTH_VIDEO}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping={false}
            isMuted
            volume={0}
            useNativeControls={false}
            pointerEvents="none"
            onError={() => setBackdrop('still')}
            onPlaybackStatusUpdate={onEarthStatus}
            videoStyle={styles.videoFill}
            style={[styles.video, { width, height }, backdrop === 'video' ? null : styles.posterHidden]}
          />
        ) : null}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(10, 26, 51, 0.96)', 'rgba(10, 26, 51, 0.55)', 'rgba(10, 26, 51, 0)']}
          locations={[0, 0.46, 1]}
          style={styles.topWash}
        />
        {backdrop === 'still' && !reducedMotion && Platform.OS === 'web' ? (
          <LimbComets width={width} height={height} limb={limb} />
        ) : null}
        <View pointerEvents="none" style={[styles.cluster, { top: clusterTop }]}>
          <Animated.View style={[styles.logo, logoStyle]}>
            <View style={[styles.mark, { width: frame, height: frame }]}>
              <Image
                source={CRANE}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
                style={{ width: frame, height: frame }}
              />
              {!reducedMotion && logoMask ? (
                <Animated.View
                  pointerEvents="none"
                  style={[styles.traceMask, { width: frame, height: frame }, logoMask, styles.traceBlend]}
                >
                  <Animated.View style={[styles.traceBand, { width: bandW, height: frame }, traceStyle]}>
                    <LinearGradient
                      colors={['rgba(255,255,255,0)', '#F3D9A6', '#FFFFFF', '#FFFFFF', '#F3D9A6', 'rgba(255,255,255,0)']}
                      locations={[0, 0.16, 0.4, 0.6, 0.84, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={[StyleSheet.absoluteFill, styles.traceGlow]}
                    />
                    <LinearGradient
                      colors={['rgba(255,255,255,0)', '#FFFFFF', '#FFFFFF', 'rgba(255,255,255,0)']}
                      locations={[0, 0.28, 0.72, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={[styles.traceCore, { left: bandW * 0.3, width: bandW * 0.4 }]}
                    />
                  </Animated.View>
                </Animated.View>
              ) : null}
            </View>
            <Text
              style={[
                styles.word,
                {
                  fontSize: wordSize,
                  letterSpacing: Math.round(wordSize * 0.2),
                  fontFamily: wordFont,
                },
              ]}
            >
              VIONA
            </Text>
          </Animated.View>
          <Animated.View style={[styles.taglines, linesStyle]}>
            <Text
              style={[
                styles.tagVi,
                {
                  fontSize: desktop ? 18 : 16,
                  fontFamily: Platform.OS === 'web' ? 'Inter_500Medium, Inter, system-ui, sans-serif' : fontsLoaded ? 'Inter_500Medium' : undefined,
                },
              ]}
            >
              {t('intro.taglineLine1')}
            </Text>
            <Text
              style={[
                styles.tagVi,
                {
                  fontSize: desktop ? 18 : 16,
                  fontFamily: Platform.OS === 'web' ? 'Inter_500Medium, Inter, system-ui, sans-serif' : fontsLoaded ? 'Inter_500Medium' : undefined,
                },
              ]}
            >
              {t('intro.taglineLine2')}
            </Text>
            <Text
              style={[
                styles.tagEn,
                {
                  fontSize: desktop ? 12 : 11,
                  letterSpacing: desktop ? 3 : 2,
                  fontFamily: Platform.OS === 'web' ? 'Inter_500Medium, Inter, system-ui, sans-serif' : fontsLoaded ? 'Inter_500Medium' : undefined,
                },
              ]}
            >
              {t('intro.taglineConnected')}
            </Text>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return createPortal(scene, document.body);
  }
  return scene;
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, zIndex: 1000, overflow: 'hidden' },
  sky: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A1A33' },
  earth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '78%',
    ...(Platform.OS === 'web'
      ? ({ objectFit: 'cover', objectPosition: 'center 46%' } as ImageStyle)
      : {}),
  },
  posterHidden: { opacity: 0 },
  video: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  videoFill:
    Platform.OS === 'web'
      ? ({ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' } as ViewStyle)
      : { ...StyleSheet.absoluteFillObject },
  topWash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '68%',
  },
  cluster: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  logo: { alignItems: 'center', gap: 4 },
  mark: { alignItems: 'center', justifyContent: 'center' },
  traceMask: { position: 'absolute', left: 0, top: 0, overflow: 'hidden' },
  traceBlend: Platform.OS === 'web' ? ({ mixBlendMode: 'plus-lighter' } as ViewStyle) : {},
  traceBand: { position: 'absolute', left: 0, top: 0 },
  traceGlow: Platform.OS === 'web' ? ({ filter: 'blur(5px)' } as ViewStyle) : {},
  traceCore: { position: 'absolute', top: 0, bottom: 0 },
  word: {
    color: '#F3D9A6',
    textAlign: 'center',
    fontWeight: '600',
    textShadowColor: 'rgba(243, 217, 166, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  taglines: { alignItems: 'center', alignSelf: 'stretch', gap: 8, marginTop: 22 },
  tagVi: { color: '#E6F4FF', textAlign: 'center', letterSpacing: 1.4 },
  tagEn: { color: '#F3D9A6', textAlign: 'center', marginTop: 8 },
});
