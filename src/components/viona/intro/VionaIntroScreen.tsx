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
const CRANE = require('../../../../assets/brand/viona/favicon2.png');

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
  const wordSize = desktop ? 56 : 40;
  const clusterHeight = markSize + Math.round(markSize * 0.12) + wordSize + 92;
  const clusterTop = Math.max(16, height * 0.4 - clusterHeight / 2);
  const veil = useSharedValue(1);
  const logo = useSharedValue(reducedMotion ? 1 : 0);
  const lines = useSharedValue(reducedMotion ? 1 : 0);
  const arc = useSharedValue(reducedMotion ? 0.35 : 0);
  const ray = useSharedValue(reducedMotion ? 0.2 : 0);

  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) onDone();
    };
    if (reducedMotion) {
      logo.value = 1;
      lines.value = 1;
      const timer = setTimeout(finish, REDUCED_HOLD_MS);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
    logo.value = withDelay(300, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
    lines.value = withDelay(500, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    arc.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.inOut(Easing.ease) }), -1, true);
    ray.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.out(Easing.quad) }), -1, false);
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
  }, [arc, lines, logo, onDone, ray, reducedMotion, veil]);

  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logo.value,
    transform: [{ scale: 0.96 + logo.value * 0.04 }],
  }));
  const linesStyle = useAnimatedStyle(() => ({ opacity: lines.value }));
  const arcStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.35 : 0.2 + arc.value * 0.55,
    transform: [{ translateX: reducedMotion ? 0 : (arc.value - 0.5) * 24 }],
  }));
  const rayStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0 : ray.value * (1 - ray.value) * 1.6,
    transform: [{ translateY: reducedMotion ? 0 : -ray.value * 36 }, { scaleY: reducedMotion ? 1 : 0.4 + ray.value * 0.6 }],
  }));

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

  return (
    <Animated.View style={[styles.fill, veilStyle]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Skip intro" onPress={skip} style={styles.fill}>
        <View style={styles.sky} />
        <Image
          source={EARTH}
          resizeMode="cover"
          onError={() => onDone()}
          style={styles.earth}
        />
        <View pointerEvents="none" style={styles.topWash} />
        <Animated.View pointerEvents="none" style={[styles.arc, styles.arcWide, arcStyle]} />
        <Animated.View pointerEvents="none" style={[styles.arc, styles.arcInner, { borderTopColor: '#007BFF' }, arcStyle]} />
        <Animated.View pointerEvents="none" style={[styles.ray, styles.rayA, rayStyle]} />
        <Animated.View pointerEvents="none" style={[styles.ray, styles.rayB, rayStyle]} />
        <Animated.View pointerEvents="none" style={[styles.ray, styles.rayC, rayStyle]} />
        <View pointerEvents="none" style={[styles.cluster, { top: clusterTop }]}>
          <Animated.View style={[styles.logo, logoStyle]}>
            <Image
              source={CRANE}
              resizeMode="contain"
              accessibilityIgnoresInvertColors
              style={{ width: markSize, height: markSize, marginBottom: Math.round(markSize * 0.12) }}
            />
            <Text
              style={[
                styles.word,
                {
                  fontSize: wordSize,
                  letterSpacing: desktop ? 10 : 6,
                  fontFamily: fontsLoaded ? 'Inter_600SemiBold' : 'Montserrat_600SemiBold',
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
                  fontFamily: fontsLoaded ? 'Inter_600SemiBold' : 'Montserrat_600SemiBold',
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
                  fontFamily: fontsLoaded ? 'Inter_600SemiBold' : 'Montserrat_600SemiBold',
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
                  fontFamily: fontsLoaded ? 'Inter_500Medium' : 'Montserrat_500Medium',
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
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, zIndex: 80 },
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
    height: '46%',
    backgroundColor: '#0A1A33',
    opacity: 0.92,
  },
  arc: {
    position: 'absolute',
    height: 80,
    borderTopWidth: 2,
    borderTopColor: '#00D1FF',
    borderRadius: 999,
  },
  arcWide: { left: '-8%', right: '-8%', top: '54%' },
  arcInner: { left: '6%', right: '6%', top: '58%' },
  ray: {
    position: 'absolute',
    width: 2,
    height: 72,
    borderRadius: 2,
    backgroundColor: '#00D1FF',
  },
  rayA: { left: '38%', bottom: '22%' },
  rayB: { left: '52%', bottom: '26%' },
  rayC: { left: '63%', bottom: '20%' },
  cluster: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  logo: { alignItems: 'center', gap: 8 },
  word: { color: '#D4AF7C', textAlign: 'center' },
  taglines: { alignItems: 'center', alignSelf: 'stretch', gap: 6, marginTop: 18 },
  tagVi: { color: '#E6F4FF', textAlign: 'center', letterSpacing: 1.4 },
  tagEn: { color: '#F3D9A6', textAlign: 'center', marginTop: 8 },
});
