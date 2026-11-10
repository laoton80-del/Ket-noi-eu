import { LinearGradient } from 'expo-linear-gradient';
// @ts-expect-error react-dom has no declaration file in this app
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
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

function limbPaint(color: string): ViewStyle {
  if (Platform.OS !== 'web') return {};
  const ring =
    'radial-gradient(circle, transparent calc(50% - 7px), #000 calc(50% - 5.5px), #000 calc(50% - 1.5px), transparent calc(50% - 0.2px))';
  return {
    backgroundImage: `conic-gradient(from 0deg, #E6F4FF 0deg, ${color} 8deg, transparent 26deg, transparent 334deg, ${color} 352deg, #E6F4FF 360deg)`,
    WebkitMaskImage: ring,
    maskImage: ring,
  } as ViewStyle;
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
  const sweep = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) onDone();
    };
    if (reducedMotion) {
      logo.value = 1;
      lines.value = 1;
      trace.value = 0;
      sweep.value = 0;
      const timer = setTimeout(finish, REDUCED_HOLD_MS);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    logo.value = withDelay(300, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    lines.value = withDelay(500, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    trace.value = withRepeat(withTiming(1, { duration: 3600, easing: Easing.linear }), -1, false);
    sweep.value = withRepeat(withTiming(1, { duration: 7000, easing: Easing.linear }), -1, false);
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
  }, [lines, logo, onDone, reducedMotion, sweep, trace, veil]);

  const limb = earthLimb(width, height);
  const logoMask = craneMaskStyle();
  const bandW = Math.max(12, Math.round(frame * 0.2));
  const blueRadius = Math.max(48, limb.radius - 8);

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
  const arcCyanStyle = useAnimatedStyle(() => {
    const span = limb.half + 16;
    return { transform: [{ rotate: `${-span + sweep.value * span * 2}deg` }] };
  });
  const arcBlueStyle = useAnimatedStyle(() => {
    const span = limb.half + 16;
    return { transform: [{ rotate: `${-span + 28 + sweep.value * span * 2}deg` }] };
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
          onError={() => onDone()}
          style={styles.earth}
        />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(10, 26, 51, 0.96)', 'rgba(10, 26, 51, 0.55)', 'rgba(10, 26, 51, 0)']}
          locations={[0, 0.46, 1]}
          style={styles.topWash}
        />
        {!reducedMotion && Platform.OS === 'web' ? (
          <>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.limbArc,
                limbPaint('#00D1FF'),
                arcCyanStyle,
                {
                  width: limb.radius * 2,
                  height: limb.radius * 2,
                  left: limb.cx - limb.radius,
                  top: limb.cy - limb.radius,
                },
              ]}
            />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.limbArc,
                limbPaint('#007BFF'),
                arcBlueStyle,
                {
                  width: blueRadius * 2,
                  height: blueRadius * 2,
                  left: limb.cx - blueRadius,
                  top: limb.cy - blueRadius,
                },
              ]}
            />
          </>
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
                <Animated.View pointerEvents="none" style={[styles.traceMask, { width: frame, height: frame }, logoMask]}>
                  <Animated.View style={[styles.traceBand, { width: bandW, height: frame }, traceStyle]}>
                    <LinearGradient
                      colors={['rgba(243,217,166,0)', '#F3D9A6', '#E6F4FF', '#F3D9A6', 'rgba(243,217,166,0)']}
                      locations={[0, 0.32, 0.5, 0.68, 1]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFill}
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
  traceBand: { position: 'absolute', left: 0, top: 0 },
  limbArc: { position: 'absolute' },
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
