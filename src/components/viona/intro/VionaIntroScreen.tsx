import { LinearGradient } from 'expo-linear-gradient';
// @ts-expect-error react-dom has no declaration file in this app
import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, type ImageStyle } from 'react-native';
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
  const glowPulse = useSharedValue(reducedMotion ? 0.72 : 0.45);
  const sweep = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) onDone();
    };
    if (reducedMotion) {
      logo.value = 1;
      lines.value = 1;
      glowPulse.value = 0.72;
      sweep.value = 0;
      const timer = setTimeout(finish, REDUCED_HOLD_MS);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    logo.value = withDelay(300, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    lines.value = withDelay(500, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    glowPulse.value = withRepeat(withTiming(0.9, { duration: 2200, easing: Easing.inOut(Easing.ease) }), -1, true);
    sweep.value = withRepeat(withTiming(1, { duration: 5200, easing: Easing.linear }), -1, false);
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
  }, [glowPulse, lines, logo, onDone, reducedMotion, sweep, veil]);

  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: 0.96 + logo.value * 0.04 }],
  }));
  const linesStyle = useAnimatedStyle(() => ({ opacity: lines.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: reducedMotion ? 0.72 : glowPulse.value }));
  const arcCyanStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0 : 0.25 + 0.55 * Math.sin(sweep.value * Math.PI * 2),
    transform: [{ translateX: (sweep.value - 0.5) * 90 }],
  }));
  const arcBlueStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0 : 0.2 + 0.45 * Math.sin((sweep.value + 0.38) * Math.PI * 2),
    transform: [{ translateX: (0.5 - sweep.value) * 70 }],
  }));
  const rayAStyle = useAnimatedStyle(() => {
    const t = sweep.value % 1;
    const fade = t < 0.55 ? t / 0.55 : (1 - t) / 0.45;
    return {
      opacity: reducedMotion ? 0 : Math.max(0, fade) * 0.85,
      transform: [{ translateY: reducedMotion ? 0 : -t * 26 }, { scaleY: 0.35 + Math.max(0, fade) * 0.65 }],
    };
  });
  const rayBStyle = useAnimatedStyle(() => {
    const t = (sweep.value + 0.33) % 1;
    const fade = t < 0.55 ? t / 0.55 : (1 - t) / 0.45;
    return {
      opacity: reducedMotion ? 0 : Math.max(0, fade) * 0.85,
      transform: [{ translateY: reducedMotion ? 0 : -t * 26 }, { scaleY: 0.35 + Math.max(0, fade) * 0.65 }],
    };
  });
  const rayCStyle = useAnimatedStyle(() => {
    const t = (sweep.value + 0.62) % 1;
    const fade = t < 0.55 ? t / 0.55 : (1 - t) / 0.45;
    return {
      opacity: reducedMotion ? 0 : Math.max(0, fade) * 0.85,
      transform: [{ translateY: reducedMotion ? 0 : -t * 22 }, { scaleY: 0.35 + Math.max(0, fade) * 0.65 }],
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
  const rimGlow =
    Platform.OS === 'web'
      ? ({
          filter:
            'drop-shadow(0 0 1px #F3D9A6) drop-shadow(0 0 3px rgba(243, 217, 166, 0.9)) drop-shadow(0 0 7px rgba(243, 217, 166, 0.45))',
        } as ImageStyle)
      : null;

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
        <View pointerEvents="none" style={[styles.cluster, { top: clusterTop }]}>
          <Animated.View style={[styles.logo, logoStyle]}>
            <View style={[styles.mark, { width: frame, height: frame }]}>
              {!reducedMotion ? (
                <Animated.Image
                  source={CRANE}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                  style={[{ width: frame, height: frame, position: 'absolute' }, rimGlow, glowStyle]}
                />
              ) : null}
              <Image
                source={CRANE}
                resizeMode="contain"
                accessibilityIgnoresInvertColors
                style={[{ width: frame, height: frame }, reducedMotion ? rimGlow : null]}
              />
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
        {!reducedMotion ? (
          <>
            <Animated.View pointerEvents="none" style={[styles.limb, styles.limbCyan, arcCyanStyle]} />
            <Animated.View pointerEvents="none" style={[styles.limb, styles.limbBlue, arcBlueStyle]} />
            <Animated.View pointerEvents="none" style={[styles.cityRay, styles.cityRayA, rayAStyle]} />
            <Animated.View pointerEvents="none" style={[styles.cityRay, styles.cityRayB, rayBStyle]} />
            <Animated.View pointerEvents="none" style={[styles.cityRay, styles.cityRayC, rayCStyle]} />
          </>
        ) : null}
      </Pressable>
    </Animated.View>
  );
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return createPortal(scene, document.body);
  }
  return scene;
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, zIndex: 1000 },
  sky: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0A1A33' },
  earth: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '78%',
    ...(Platform.OS === 'web'
      ? ({ objectFit: 'cover', objectPosition: 'center bottom' } as ImageStyle)
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
  limb: {
    position: 'absolute',
    height: 90,
    borderTopWidth: 2,
    borderRadius: 999,
  },
  limbCyan: { left: '-6%', right: '-6%', bottom: '16%', borderTopColor: '#00D1FF' },
  limbBlue: { left: '4%', right: '4%', bottom: '12%', borderTopColor: '#007BFF' },
  cityRay: {
    position: 'absolute',
    width: 2,
    height: 46,
    borderRadius: 2,
    backgroundColor: '#00D1FF',
  },
  cityRayA: { left: '34%', bottom: '18%' },
  cityRayB: { left: '51%', bottom: '15%', backgroundColor: '#007BFF' },
  cityRayC: { left: '66%', bottom: '19%' },
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
