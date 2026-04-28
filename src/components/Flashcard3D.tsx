import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FontFamily } from '../theme/typography';
import { theme } from '../theme/theme';

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
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 5,
  },
  frontCard: {
    backgroundColor: theme.colors.CeolWhite,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
  },
  promptText: {
    ...theme.typeScale.h2,
    color: theme.colors.GraphiteBlue,
    fontFamily: FontFamily.extrabold,
    textAlign: 'center',
    lineHeight: theme.typeScale.h2.lineHeight,
  },
  backCard: {
    backgroundColor: theme.colors.SoftMineralGrey,
    borderWidth: 1.5,
    borderColor: theme.colors.RouteError,
  },
  backTitle: {
    ...theme.typeScale.caption,
    color: theme.colors.RouteError,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
    marginTop: 2,
  },
  meaningText: {
    ...theme.typeScale.body,
    color: theme.colors.GraphiteBlue,
    fontFamily: FontFamily.medium,
    lineHeight: theme.typeScale.body.lineHeight,
    marginBottom: 6,
  },
  knowledgeText: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    lineHeight: theme.typeScale.caption.lineHeight,
  },
});

