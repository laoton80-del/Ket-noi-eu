import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCopilot, type TooltipProps } from 'react-native-copilot';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

export function CustomTooltip({ labels }: TooltipProps) {
  const { currentStep, currentStepNumber, totalStepsNumber, isLastStep, goToNext, stop } = useCopilot();
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    bounce.setValue(0);
    Animated.spring(bounce, {
      toValue: 1,
      useNativeDriver: true,
      speed: 14,
      bounciness: 8,
    }).start();
  }, [bounce, currentStep?.name]);

  return (
    <Animated.View
      style={StyleSheet.flatten([
        styles.card,
        {
          opacity: bounce.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
          transform: [
            { translateY: bounce.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
            { scale: bounce.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1] }) },
          ],
        },
      ])}
    >
      <Text style={styles.stepMeta}>
        Bước {currentStepNumber}/{totalStepsNumber}
      </Text>
      <Text style={styles.title}>{currentStep?.name ?? 'Giới thiệu nhanh'}</Text>
      <Text style={styles.description}>{currentStep?.text ?? ''}</Text>

      <View style={styles.actions}>
        <Pressable style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.85 }]} onPress={() => void stop()}>
          <Text style={styles.skipText}>{labels.skip ?? 'Bỏ qua'}</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.nextBtn, pressed && { opacity: 0.88 }]} onPress={() => void goToNext()}>
          <Text style={styles.nextText}>{isLastStep ? labels.finish ?? 'Hoàn tất' : labels.next ?? 'Tiếp tục'}</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.modal.shadowOffset,
    shadowOpacity: theme.elevation.modal.shadowOpacity,
    shadowRadius: theme.elevation.modal.shadowRadius,
    elevation: theme.elevation.modal.elevation,
  },
  stepMeta: {
    ...theme.typeScale.caption,
    color: theme.colors.primary,
    fontFamily: FontFamily.semibold,
  },
  title: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  description: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  actions: {
    marginTop: theme.spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  skipBtn: {
    flex: 1,
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  nextBtn: {
    flex: 1,
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    ...theme.typeScale.caption,
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.bold,
  },
});
