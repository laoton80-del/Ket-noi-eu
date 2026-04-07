import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../theme/colors';

const BAR_COUNT = 7;

type Props = {
  active: boolean;
};

export function VoiceRecordingWaveform({ active }: Props) {
  const values = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.35))
  ).current;

  useEffect(() => {
    if (!active) {
      values.forEach((v) => v.setValue(0.35));
      return;
    }

    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: 260 + i * 45,
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0.2,
            duration: 260 + i * 45,
            useNativeDriver: true,
          }),
        ])
      )
    );

    loops.forEach((l) => l.start());
    return () => {
      loops.forEach((l) => l.stop());
    };
  }, [active, values]);

  return (
    <View style={styles.row} pointerEvents="none">
      {values.map((v, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              transform: [
                {
                  scaleY: v,
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 32,
    marginBottom: 10,
  },
  bar: {
    width: 5,
    height: 28,
    marginHorizontal: 3,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    opacity: 0.85,
  },
});
