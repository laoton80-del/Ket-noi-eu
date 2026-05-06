import { Audio } from 'expo-av';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { generateSpeech } from '../../services/OpenAIService';
import { KIDS_MODE_TOKENS } from '../../theme/kidsModeTokens';
import { FontFamily } from '../../theme/typography';
import type { TeacherEmotion } from './TeacherAvatar';

type GameItem = Readonly<{
  id: string;
  emoji: string;
  wordVi: string;
}>;

const GAME_ITEMS: readonly GameItem[] = [
  { id: 'apple', emoji: '🍎', wordVi: 'Quả Táo' },
  { id: 'cat', emoji: '🐱', wordVi: 'Con Mèo' },
  { id: 'book', emoji: '📘', wordVi: 'Quyển Sách' },
] as const;

export function KidsMatchingGame({
  onLevelComplete,
  onEmotionChange,
}: Readonly<{
  onLevelComplete: () => void;
  onEmotionChange?: (emotion: TeacherEmotion) => void;
}>) {
  const [round, setRound] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  const [wins, setWins] = useState(0);
  const completedRef = useRef(false);
  const lastTapAtRef = useRef(0);
  const confetti = useSharedValue(0);

  const target = useMemo(() => GAME_ITEMS[round % GAME_ITEMS.length], [round]);

  useEffect(() => {
    onEmotionChange?.('speaking');
    void (async () => {
      try {
        const cueUri = await generateSpeech(`Find: ${target.wordVi}`, 'nova');
        const { sound } = await Audio.Sound.createAsync({ uri: cueUri }, { shouldPlay: true });
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) onEmotionChange?.('idle');
        });
      } catch {
        onEmotionChange?.('idle');
      }
    })();
  }, [target.wordVi, onEmotionChange]);

  const confettiStyle = useAnimatedStyle(() => ({
    opacity: interpolate(confetti.value, [0, 1], [0, 1]),
    transform: [{ translateY: interpolate(confetti.value, [0, 1], [0, 24]) }],
  }));

  const triggerDing = async () => {
    try {
      const dingUri = await generateSpeech('Ding! Giỏi quá!', 'shimmer');
      const { sound } = await Audio.Sound.createAsync({ uri: dingUri }, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) onEmotionChange?.('idle');
      });
    } catch {
      onEmotionChange?.('idle');
    }
  };

  const onPick = (id: string) => {
    const now = Date.now();
    if (now - lastTapAtRef.current < 120) return;
    lastTapAtRef.current = now;
    if (locked) return;
    setLocked(true);
    setSelectedId(id);
    const correct = id === target.id;
    setIsCorrect(correct);
    if (correct) {
      onEmotionChange?.('praising');
      confetti.value = 0;
      confetti.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.quad) });
      void triggerDing();
      setWins((prev) => {
        const next = prev + 1;
        if (next >= 3 && !completedRef.current) {
          completedRef.current = true;
          onLevelComplete();
        }
        return next;
      });
    } else {
      onEmotionChange?.('listening');
    }

    setTimeout(() => {
      setRound((prev) => prev + 1);
      setSelectedId(null);
      setIsCorrect(null);
      setLocked(false);
      onEmotionChange?.('idle');
    }, 900);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.cueCard}>
        <Text style={styles.cueLabel}>Cô AI nói:</Text>
        <Text style={styles.cueWord}>Find: {target.wordVi}</Text>
      </View>

      <View style={styles.optionsRow}>
        {GAME_ITEMS.map((item) => {
          const picked = selectedId === item.id;
          const good = picked && isCorrect;
          const bad = picked && isCorrect === false;
          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [
                styles.optionBtn,
                good && styles.optionGood,
                bad && styles.optionBad,
                pressed && !locked && { transform: [{ scale: 0.98 }] },
              ]}
              onPress={() => onPick(item.id)}
              disabled={locked}
            >
              <Text style={styles.optionEmoji}>{item.emoji}</Text>
              <Text style={styles.optionWord}>{item.wordVi}</Text>
              {good ? <Text style={styles.goodMark}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>

      <Animated.View style={[styles.confettiTextWrap, confettiStyle]} pointerEvents="none">
        <Text style={styles.confettiText}>🎉 ✨ 🎊</Text>
      </Animated.View>

      <Text style={styles.progress}>Mini-game level: {wins}/3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  cueCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#93C5FD',
    backgroundColor: '#EFF6FF',
    padding: 12,
    alignItems: 'center',
  },
  cueLabel: { color: '#1D4ED8', fontSize: 12, fontFamily: FontFamily.bold },
  cueWord: { color: '#1E40AF', fontSize: 24, fontFamily: FontFamily.extrabold, marginTop: 4 },
  optionsRow: { flexDirection: 'row', gap: 8 },
  optionBtn: {
    flex: 1,
    minHeight: 118,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  optionGood: { borderColor: KIDS_MODE_TOKENS.colors.success, backgroundColor: '#DCFCE7' },
  optionBad: { borderColor: KIDS_MODE_TOKENS.colors.danger, backgroundColor: '#FEE2E2' },
  optionEmoji: { fontSize: 34 },
  optionWord: { marginTop: 4, color: '#334155', fontSize: 12, textAlign: 'center', fontFamily: FontFamily.bold },
  goodMark: { marginTop: 2, color: '#166534', fontSize: 20, fontFamily: FontFamily.extrabold },
  confettiTextWrap: { alignItems: 'center', minHeight: 22 },
  confettiText: { fontSize: 18 },
  progress: { textAlign: 'center', color: '#7C3AED', fontSize: 12, fontFamily: FontFamily.bold },
});
