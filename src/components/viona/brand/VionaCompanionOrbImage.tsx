import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';

import { ensureVionaReducedMotionGuard } from '../home/vionaReducedMotionGuard';

const ORB = require('../../../../assets/brand/viona/orb-companion.png');

/** Licensed companion orb. The glow is in the asset; this only breathes it. */
export function VionaCompanionOrbImage({
  size,
  reducedMotion = false,
}: Readonly<{ size: number; reducedMotion?: boolean }>) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    ensureVionaReducedMotionGuard();
    if (reducedMotion) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reducedMotion]);

  return (
    <Animated.View
      style={[
        { width: size, height: size },
        reducedMotion
          ? undefined
          : {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
            },
      ]}
    >
      <Image
        source={ORB}
        resizeMode="contain"
        accessibilityIgnoresInvertColors
        style={styles.image}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: { width: '100%', height: '100%' },
});
