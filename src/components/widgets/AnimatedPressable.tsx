import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedView = Animated.createAnimatedComponent(Pressable);

export const AnimatedPressable: React.FC<PressableProps> = ({ children, ...props }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedView
      {...props}
      style={[animatedStyle, props.style]}
      onPressIn={(e) => {
        scale.value = withTiming(0.97, { duration: 100 });
        props.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withTiming(1, { duration: 120 });
        props.onPressOut?.(e);
      }}
    >
      {children}
    </AnimatedView>
  );
};

