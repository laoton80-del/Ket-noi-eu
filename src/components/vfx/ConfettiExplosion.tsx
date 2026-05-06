import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

type ConfettiExplosionProps = {
  visible: boolean;
  onComplete?: () => void;
};

const CONFETTI_URI =
  'https://assets10.lottiefiles.com/packages/lf20_jbrw3hcz.json';

export function ConfettiExplosion({ visible, onComplete }: ConfettiExplosionProps) {
  const lottieRef = useRef<LottieView>(null);

  useEffect(() => {
    if (!visible) return;
    lottieRef.current?.play();
    const timer = setTimeout(() => {
      onComplete?.();
    }, 1600);
    return () => clearTimeout(timer);
  }, [onComplete, visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <LottieView
        ref={lottieRef}
        source={{ uri: CONFETTI_URI }}
        autoPlay
        loop={false}
        style={styles.animation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3000,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});
