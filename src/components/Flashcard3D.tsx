import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FontFamily } from '../theme/typography';

type Flashcard3DProps = {
  prompt: string;
  meaning: string;
  knowledge: string;
};

export function Flashcard3D({ prompt, meaning, knowledge }: Flashcard3DProps) {
  const rotate = useSharedValue(0);

  const frontStyle = useAnimatedStyle(() => {
    const r = interpolate(rotate.value, [0, 1], [0, 180]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${r}deg` }],
      opacity: rotate.value < 0.5 ? 1 : 0,
    };
  });

  const backStyle = useAnimatedStyle(() => {
    const r = interpolate(rotate.value, [0, 1], [180, 360]);
    return {
      transform: [{ perspective: 1000 }, { rotateY: `${r}deg` }],
      opacity: rotate.value < 0.5 ? 0 : 1,
    };
  });

  const onFlip = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    rotate.value = withSpring(rotate.value > 0.5 ? 0 : 1, {
      stiffness: 180,
      damping: 16,
      mass: 0.9,
    });
  };

  return (
    <Pressable onPress={onFlip} style={({ pressed }) => [styles.wrap, pressed && { opacity: 0.92 }]}>
      <Animated.View style={[styles.card, styles.frontCard, frontStyle]}>
        <View style={styles.innerGlow} />
        <Text numberOfLines={4} style={styles.promptText}>
          {prompt}
        </Text>
      </Animated.View>

      <Animated.View style={[styles.card, styles.backCard, backStyle]}>
        <Text style={styles.backTitle}>Dịch nghĩa</Text>
        <Text numberOfLines={3} style={styles.meaningText}>
          {meaning}
        </Text>
        <Text style={styles.backTitle}>Kiến thức</Text>
        <Text numberOfLines={3} style={styles.knowledgeText}>
          {knowledge}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '48%',
    height: 200,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 18,
    padding: 12,
    backfaceVisibility: 'hidden',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  frontCard: {
    backgroundColor: '#FFFDF8',
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(139,115,85,0.16)',
  },
  promptText: {
    fontSize: 18,
    color: '#2B241B',
    fontFamily: FontFamily.extrabold,
    textAlign: 'center',
    lineHeight: 24,
  },
  backCard: {
    backgroundColor: '#FFFAF1',
    borderWidth: 1.5,
    borderColor: 'rgba(226, 92, 92, 0.55)',
  },
  backTitle: {
    fontSize: 12,
    color: '#A63F3F',
    fontFamily: FontFamily.bold,
    marginBottom: 4,
    marginTop: 2,
  },
  meaningText: {
    fontSize: 13,
    color: '#2B241B',
    fontFamily: FontFamily.medium,
    lineHeight: 18,
    marginBottom: 6,
  },
  knowledgeText: {
    fontSize: 12,
    color: '#5B4A36',
    fontFamily: FontFamily.regular,
    lineHeight: 17,
  },
});

