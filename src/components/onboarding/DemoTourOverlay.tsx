import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, type ReactElement } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  playAcademyMockAudio,
  stopAcademyMockAudio,
  V7_DEMO_SEQUENCE,
} from '../../services/ux/AppTourService';
import { useDemoModeStore } from '../../store/demoModeStore';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import type { RootStackParamList } from '../../navigation/routes';

type StackNav = NativeStackNavigationProp<RootStackParamList>;

export function DemoTourOverlay(): ReactElement | null {
  const navigation = useNavigation<StackNav>();
  const { width, height } = useWindowDimensions();
  const isDemoMode = useDemoModeStore((s) => s.isDemoMode);
  const tourActive = useDemoModeStore((s) => s.tourActive);
  const tourStepIndex = useDemoModeStore((s) => s.tourStepIndex);
  const nextTourStep = useDemoModeStore((s) => s.nextTourStep);
  const endTour = useDemoModeStore((s) => s.endTour);

  const pulse = useRef(new Animated.Value(1)).current;
  const academyStartedRef = useRef(false);

  const step = V7_DEMO_SEQUENCE[tourStepIndex] ?? V7_DEMO_SEQUENCE[0];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.12,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    if (isDemoMode && tourActive) loop.start();
    return () => {
      loop.stop();
    };
  }, [isDemoMode, tourActive, pulse]);

  useEffect(() => {
    if (!step?.tabTarget || !isDemoMode || !tourActive) return;
    navigation.navigate('Tabs', { screen: step.tabTarget });
  }, [navigation, step?.tabTarget, isDemoMode, tourActive, tourStepIndex]);

  useEffect(() => {
    if (!isDemoMode || !tourActive) {
      academyStartedRef.current = false;
      stopAcademyMockAudio();
      return;
    }
    if (step?.id !== 'academy_audio') {
      academyStartedRef.current = false;
      return;
    }
    if (academyStartedRef.current) return;
    academyStartedRef.current = true;
    void playAcademyMockAudio();
  }, [isDemoMode, tourActive, step?.id]);

  const ringStyle = useMemo(() => {
    const cx = step.pulse.x * width;
    const cy = step.pulse.y * height;
    const d = Math.min(width, height) * step.pulse.r * 2;
    return {
      left: cx - d / 2,
      top: cy - d / 2,
      width: d,
      height: d,
      borderRadius: d / 2,
    };
  }, [height, step.pulse, width]);

  const onSkip = useCallback(() => {
    stopAcademyMockAudio();
    endTour();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [endTour, navigation]);

  const onNext = useCallback(() => {
    if (tourStepIndex >= V7_DEMO_SEQUENCE.length - 1) {
      stopAcademyMockAudio();
      endTour();
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
      return;
    }
    nextTourStep();
  }, [endTour, navigation, nextTourStep, tourStepIndex]);

  if (!isDemoMode || !tourActive) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.modalRoot} pointerEvents="box-none">
        <LinearGradient
          colors={['rgba(5, 11, 20, 0.82)', 'rgba(10, 22, 40, 0.88)', 'rgba(5, 11, 20, 0.85)']}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View
          style={[
            styles.pulseRing,
            ringStyle,
            {
              transform: [{ scale: pulse }],
              borderColor: step.id === 'travel_platinum' ? '#E5E4E2' : theme.colors.SignatureGold,
              shadowColor: step.id === 'travel_platinum' ? '#E5E4E2' : theme.colors.SignatureGold,
            },
          ]}
        />

        <View style={styles.copyBlock} pointerEvents="box-none">
          <Text style={styles.kicker}>V7 OMNIVERSE · DEMO</Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.subtitle}>{step.subtitle}</Text>
          <View style={styles.actions}>
            <Pressable onPress={onSkip} style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.85 }]}>
              <Text style={styles.skipText}>Skip Tour</Text>
            </Pressable>
            <Pressable onPress={onNext} style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.9 }]}>
              <Text style={styles.nextText}>
                {tourStepIndex >= V7_DEMO_SEQUENCE.length - 1 ? 'Finish' : 'Next'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const { height: SCREEN_H } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 3,
    backgroundColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 24,
    elevation: 16,
  },
  copyBlock: {
    paddingHorizontal: 22,
    paddingBottom: Math.max(28, SCREEN_H * 0.06),
    paddingTop: 20,
    gap: 10,
    backgroundColor: 'rgba(10, 22, 40, 0.72)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  kicker: {
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.primaryBright,
  },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  skipBtn: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(244, 241, 234, 0.35)',
    flex: 1,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.secondary,
  },
  nextBtn: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: theme.colors.SignatureGold,
    flex: 1,
    alignItems: 'center',
  },
  nextText: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.DeepInkNavy,
  },
});
