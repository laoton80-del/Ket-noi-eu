import LottieView from 'lottie-react-native';
import type { ComponentProps } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

type SOSLottiePlayerProps = {
  source: NonNullable<ComponentProps<typeof LottieView>['source']>;
  autoPlay?: boolean;
  loop?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SOSLottiePlayer({
  source,
  autoPlay = true,
  loop = true,
  style,
}: SOSLottiePlayerProps) {
  return (
    <LottieView
      source={source}
      autoPlay={autoPlay}
      loop={loop}
      style={style}
      resizeMode="contain"
    />
  );
}
