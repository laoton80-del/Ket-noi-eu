import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

type SuccessCheckmark3DProps = {
  visible: boolean;
  onClose: () => void;
};

export function SuccessCheckmark3D({ visible, onClose }: SuccessCheckmark3DProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const onPresented = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onClose();
      timerRef.current = null;
    }, 1500);
  };

  useEffect(() => {
    if (!visible) return;
    scale.value = 0;
    opacity.value = 0;

    opacity.value = withTiming(1, { duration: 220 });
    scale.value = withSpring(
      1.2,
      { damping: 10, stiffness: 120 },
      (finished) => {
        if (!finished) return;
        scale.value = withSpring(1, { damping: 10, stiffness: 120 });
        runOnJS(onPresented)();
      }
    );
  }, [opacity, scale, visible]);

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[styles.medallion, badgeStyle]}>
        <View style={styles.innerHighlight} />
        <Check size={34} color="#0A1628" strokeWidth={3} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5, 11, 20, 0.58)',
  },
  medallion: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C5A059',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(232, 213, 163, 0.65)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 14,
  },
  innerHighlight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
});
