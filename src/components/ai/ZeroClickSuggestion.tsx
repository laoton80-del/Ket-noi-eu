import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type ZeroClickSuggestionProps = {
  visible?: boolean;
  onConfirmed?: () => void;
};

const SWIPE_THRESHOLD = 180;

export function ZeroClickSuggestion({ visible = true, onConfirmed }: ZeroClickSuggestionProps) {
  const [confirmed, setConfirmed] = useState(false);
  const translateX = useSharedValue(0);

  const completeSwipe = () => {
    setConfirmed(true);
    onConfirmed?.();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = Math.max(0, event.translationX);
    })
    .onEnd(() => {
      if (translateX.value >= SWIPE_THRESHOLD) {
        translateX.value = withTiming(SWIPE_THRESHOLD, { duration: 120 });
        runOnJS(completeSwipe)();
      } else {
        translateX.value = withTiming(0, { duration: 180 });
      }
    });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.wrap}>
      <BlurView intensity={28} tint="dark" style={styles.card}>
        <Text style={styles.title}>Dự đoán: Cần nhập thêm hóa chất làm móng.</Text>
        <Text style={styles.subtitle}>Vuốt phải để xác nhận đặt hàng ($45).</Text>
        <View style={styles.swipeTrack}>
          <GestureDetector gesture={pan}>
            <Animated.View style={StyleSheet.flatten([styles.swipeThumb, thumbStyle])}>
              <Text style={styles.swipeLabel}>{confirmed ? 'Đã xác nhận' : 'Vuốt'}</Text>
            </Animated.View>
          </GestureDetector>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surface,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  title: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.semibold,
  },
  subtitle: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  swipeTrack: {
    marginTop: theme.spacing.xs,
    height: 44,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.colors.executive.panelMuted,
    justifyContent: 'center',
    paddingHorizontal: 2,
    overflow: 'hidden',
  },
  swipeThumb: {
    width: 140,
    height: 38,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeLabel: {
    ...theme.typeScale.caption,
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.bold,
  },
});
