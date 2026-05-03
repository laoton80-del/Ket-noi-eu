import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppImage } from '../ui/AppImage';
import Animated, {
  Easing,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { KIDS_MODE_TOKENS } from '../../theme/kidsModeTokens';
import { FontFamily } from '../../theme/typography';

export type TeacherEmotion = 'idle' | 'listening' | 'speaking' | 'praising';

const AVATAR_URI =
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80';
const CONFETTI_COLORS = ['#F59E0B', '#EC4899', '#10B981', '#3B82F6', '#8B5CF6'] as const;

function WaveBar({
  delayMs,
  active,
}: Readonly<{
  delayMs: number;
  active: boolean;
}>) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (active) {
      progress.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 340 + delayMs, easing: Easing.out(Easing.quad) }),
          withTiming(0.15, { duration: 340 + delayMs, easing: Easing.in(Easing.quad) })
        ),
        -1,
        false
      );
      return;
    }
    progress.value = withTiming(0, { duration: 180 });
  }, [active, delayMs, progress]);

  const style = useAnimatedStyle(() => {
    const h = interpolate(progress.value, [0, 1], [10, 26]);
    return { height: h };
  });

  return <Animated.View style={[styles.waveBar, style]} />;
}

function ConfettiPiece({
  index,
  progress,
}: Readonly<{
  index: number;
  progress: SharedValue<number>;
}>) {
  const style = useAnimatedStyle(() => {
    const spread = (index - 4) * 16;
    const y = interpolate(progress.value, [0, 1], [0, 90 + index * 6]);
    const opacity = interpolate(progress.value, [0, 0.85, 1], [0, 1, 0]);
    const rotate = `${interpolate(progress.value, [0, 1], [0, 210 + index * 10])}deg`;
    return {
      opacity,
      transform: [{ translateX: spread }, { translateY: y }, { rotate }],
    };
  });
  return (
    <Animated.View
      style={[styles.confettiPiece, { backgroundColor: CONFETTI_COLORS[index % CONFETTI_COLORS.length] }, style]}
    />
  );
}

export function TeacherAvatar({
  currentEmotion,
}: Readonly<{
  currentEmotion: TeacherEmotion;
}>) {
  const ringPulse = useSharedValue(0);
  const avatarScale = useSharedValue(1);
  const confettiProgress = useSharedValue(0);

  useEffect(() => {
    if (currentEmotion === 'speaking') {
      ringPulse.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else if (currentEmotion === 'listening') {
      ringPulse.value = withRepeat(withTiming(0.7, { duration: 700, easing: Easing.inOut(Easing.quad) }), -1, true);
    } else {
      ringPulse.value = withTiming(0, { duration: KIDS_MODE_TOKENS.motion.quickMs });
    }
  }, [currentEmotion, ringPulse]);

  useEffect(() => {
    if (currentEmotion !== 'praising') {
      avatarScale.value = withTiming(1, { duration: KIDS_MODE_TOKENS.motion.quickMs });
      return;
    }
    avatarScale.value = withSequence(
      withTiming(1.08, { duration: 190, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 220, easing: Easing.inOut(Easing.quad) })
    );
    confettiProgress.value = 0;
    confettiProgress.value = withTiming(1, { duration: KIDS_MODE_TOKENS.motion.celebratoryMs, easing: Easing.out(Easing.quad) });
  }, [currentEmotion, avatarScale, confettiProgress]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ringPulse.value, [0, 1], [0.25, 0.92]),
    transform: [{ scale: interpolate(ringPulse.value, [0, 1], [1, 1.16]) }],
  }));

  const avatarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const statusText = useMemo(() => {
    if (currentEmotion === 'listening') return 'Cô đang lắng nghe con...';
    if (currentEmotion === 'speaking') return 'Cô đang đọc mẫu cho con';
    if (currentEmotion === 'praising') return 'Giỏi lắm! Cô khen con nè';
    return 'Cô sẵn sàng bắt đầu bài học';
  }, [currentEmotion]);

  return (
    <View style={styles.wrap}>
      <View style={styles.avatarZone}>
        <Animated.View style={[styles.pulseRing, pulseStyle]} />
        <Animated.View style={[styles.avatarFrame, avatarStyle]}>
          <AppImage source={{ uri: AVATAR_URI }} style={styles.avatarImage} />
        </Animated.View>
        {currentEmotion === 'praising' ? (
          <View style={styles.confettiWrap} pointerEvents="none">
            {Array.from({ length: 9 }).map((_, index) => (
              <ConfettiPiece key={`piece-${index}`} index={index} progress={confettiProgress} />
            ))}
          </View>
        ) : null}
      </View>

      <Text style={styles.teacherName}>Cô giáo AI</Text>
      <Text style={styles.statusText}>{statusText}</Text>

      {currentEmotion === 'speaking' ? (
        <View style={styles.waveWrap}>
          <WaveBar delayMs={10} active />
          <WaveBar delayMs={70} active />
          <WaveBar delayMs={130} active />
          <WaveBar delayMs={90} active />
          <WaveBar delayMs={20} active />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6, marginTop: 2, marginBottom: 4 },
  avatarZone: {
    width: 186,
    height: 186,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 178,
    height: 178,
    borderRadius: 89,
    backgroundColor: 'rgba(59,130,246,0.16)',
    borderWidth: 2,
    borderColor: 'rgba(59,130,246,0.58)',
  },
  avatarFrame: {
    width: 166,
    height: 166,
    borderRadius: 83,
    borderWidth: 4,
    borderColor: '#FDE68A',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  confettiWrap: {
    position: 'absolute',
    top: 32,
    width: 184,
    alignItems: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 14,
    borderRadius: 3,
  },
  teacherName: { color: '#0C4A6E', fontSize: 20, fontFamily: FontFamily.extrabold },
  statusText: { color: '#334155', fontSize: 13, fontFamily: FontFamily.medium },
  waveWrap: {
    marginTop: 4,
    minHeight: 28,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#E0E7FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  waveBar: {
    width: 6,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
  },
});
