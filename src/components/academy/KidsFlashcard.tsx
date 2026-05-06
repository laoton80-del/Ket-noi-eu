import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { generateSpeech } from '../../services/OpenAIService';
import { KIDS_MODE_TOKENS } from '../../theme/kidsModeTokens';
import { FontFamily } from '../../theme/typography';
import type { LocalLanguageCode } from '../../utils/languageMapper';
import type { TeacherEmotion } from './TeacherAvatar';

type FlashcardWord = Readonly<{
  id: string;
  emoji: string;
  vi: string;
  translations: Readonly<Record<LocalLanguageCode, string>>;
}>;

const WORDS: readonly FlashcardWord[] = [
  {
    id: 'apple',
    emoji: '🍎',
    vi: 'Quả Táo',
    translations: { vi: 'Quả Táo', en: 'Apple', cs: 'Jablko', de: 'Apfel', ja: 'りんご' },
  },
  {
    id: 'book',
    emoji: '📘',
    vi: 'Quyển Sách',
    translations: { vi: 'Quyển Sách', en: 'Book', cs: 'Kniha', de: 'Buch', ja: '本' },
  },
  {
    id: 'cat',
    emoji: '🐱',
    vi: 'Con Mèo',
    translations: { vi: 'Con Mèo', en: 'Cat', cs: 'Kočka', de: 'Katze', ja: 'ねこ' },
  },
] as const;

const SCORE_PASS_MIN = 80 as const;
const LEVEL_PASS_COUNT = 3 as const;
const TAP_GUARD_MS = 180 as const;

export function KidsFlashcard({
  localLanguageCode,
  localLanguageLabel,
  onLevelComplete,
  onEmotionChange,
}: Readonly<{
  localLanguageCode: LocalLanguageCode;
  localLanguageLabel: string;
  onLevelComplete: () => void;
  onEmotionChange?: (emotion: TeacherEmotion) => void;
}>) {
  const [index, setIndex] = useState(0);
  const [isFront, setIsFront] = useState(true);
  const [assessing, setAssessing] = useState(false);
  const [lastScore, setLastScore] = useState<number | null>(null);
  const [passCount, setPassCount] = useState(0);
  const completedRef = useRef(false);
  const lastTapAtRef = useRef(0);
  const spin = useSharedValue(0);

  const item = WORDS[index];
  const translated = item.translations[localLanguageCode] ?? item.translations.en;

  const frontStyle = useAnimatedStyle(() => {
    const rotateY = `${interpolate(spin.value, [0, 1], [0, 180])}deg`;
    const opacity = interpolate(spin.value, [0, 0.5, 1], [1, 0, 0]);
    return { transform: [{ perspective: 1000 }, { rotateY }], opacity };
  });
  const backStyle = useAnimatedStyle(() => {
    const rotateY = `${interpolate(spin.value, [0, 1], [180, 360])}deg`;
    const opacity = interpolate(spin.value, [0, 0.5, 1], [0, 0, 1]);
    return { transform: [{ perspective: 1000 }, { rotateY }], opacity };
  });

  const flip = () => {
    const now = Date.now();
    if (now - lastTapAtRef.current < TAP_GUARD_MS) return;
    lastTapAtRef.current = now;
    const nextFront = !isFront;
    setIsFront(nextFront);
    spin.value = withTiming(nextFront ? 0 : 1, { duration: 420, easing: Easing.inOut(Easing.quad) });
  };

  const playWordAudio = async () => {
    onEmotionChange?.('speaking');
    try {
      const uri = await generateSpeech(item.vi, 'shimmer');
      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) onEmotionChange?.('idle');
      });
    } catch {
      onEmotionChange?.('idle');
    }
  };

  const assessPronunciation = async () => {
    if (assessing) return;
    setAssessing(true);
    onEmotionChange?.('listening');
    try {
      await new Promise((resolve) => setTimeout(resolve, 420));
      // Mock AI voice assessment: guaranteed pass above 80 for now.
      const score = 82 + Math.floor(Math.random() * 18);
      setLastScore(score);
      onEmotionChange?.('praising');
      setPassCount((prev) => {
        const next = prev + 1;
        if (next >= LEVEL_PASS_COUNT && !completedRef.current) {
          completedRef.current = true;
          onLevelComplete();
        }
        return next;
      });
    } finally {
      setAssessing(false);
      setTimeout(() => onEmotionChange?.('idle'), 700);
    }
  };

  const nextCard = () => {
    if (assessing) return;
    setIndex((prev) => (prev + 1) % WORDS.length);
    setLastScore(null);
    if (!isFront) {
      setIsFront(true);
      spin.value = withTiming(0, { duration: 260 });
    }
  };

  const scoreText = useMemo(() => {
    if (lastScore === null) return 'Nhấn micro để cô chấm phát âm';
    return lastScore >= SCORE_PASS_MIN ? `Tuyệt vời! Bé đạt ${lastScore}%` : `Bé đạt ${lastScore}% - thử lại nhé`;
  }, [lastScore]);

  return (
    <View style={styles.wrap}>
      <View style={styles.cardStack}>
        <Animated.View style={[styles.card, styles.frontCard, frontStyle]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
          <Text style={styles.mainWord}>{item.vi}</Text>
          <Pressable style={({ pressed }) => [styles.audioBtn, pressed && { opacity: 0.86 }]} onPress={() => void playWordAudio()}>
            <Ionicons name="volume-high" size={16} color="#FFFFFF" />
            <Text style={styles.audioBtnText}>Play Audio</Text>
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.card, styles.backCard, backStyle]}>
          <Text style={styles.translationLabel}>Dịch sang {localLanguageLabel}</Text>
          <Text style={styles.translationWord}>{translated}</Text>
          <Text style={styles.translationHint}>Lật lại để bé luyện phát âm</Text>
        </Animated.View>
      </View>

      <View style={styles.row}>
        <Pressable style={({ pressed }) => [styles.cta, styles.flipBtn, pressed && { opacity: 0.86 }]} onPress={flip}>
          <Text style={styles.ctaText}>{isFront ? 'Xem nghĩa' : 'Về mặt trước'}</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.cta, styles.nextBtn, pressed && { opacity: 0.86 }]} onPress={nextCard}>
          <Text style={styles.ctaText}>Thẻ tiếp theo</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.micBtn, assessing && styles.micBtnBusy, pressed && { transform: [{ scale: 0.98 }] }]}
        onPress={() => void assessPronunciation()}
        disabled={assessing}
      >
        {assessing ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="mic" size={26} color="#FFFFFF" />}
      </Pressable>
      <Text style={styles.scoreText}>{scoreText}</Text>
      <Text style={styles.progressText}>Level Flashcard: {passCount}/{LEVEL_PASS_COUNT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, alignItems: 'center' },
  cardStack: { width: '100%', maxWidth: 360, height: 220 },
  card: {
    position: 'absolute',
    width: '100%',
    height: 220,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    backfaceVisibility: 'hidden',
  },
  frontCard: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderColor: '#A5F3FC',
    shadowColor: '#22D3EE',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  backCard: {
    backgroundColor: 'rgba(254,243,199,0.95)',
    borderColor: '#FCD34D',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  emoji: { fontSize: 46, marginBottom: 6 },
  mainWord: { color: '#0F172A', fontSize: 30, fontFamily: FontFamily.extrabold, marginBottom: 10 },
  audioBtn: {
    minHeight: 36,
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  audioBtnText: { color: '#FFFFFF', fontSize: 12, fontFamily: FontFamily.bold },
  translationLabel: { color: '#92400E', fontSize: 13, fontFamily: FontFamily.bold },
  translationWord: { color: '#78350F', fontSize: 33, fontFamily: FontFamily.extrabold, marginTop: 8 },
  translationHint: { color: '#A16207', fontSize: 12, marginTop: 10, fontFamily: FontFamily.medium },
  row: { flexDirection: 'row', gap: 8 },
  cta: { minHeight: KIDS_MODE_TOKENS.accessibility.minTouchTarget, borderRadius: KIDS_MODE_TOKENS.radius.pill, paddingHorizontal: 14, justifyContent: 'center' },
  flipBtn: { backgroundColor: '#A78BFA' },
  nextBtn: { backgroundColor: '#38BDF8' },
  ctaText: { color: '#FFFFFF', fontSize: 12, fontFamily: FontFamily.bold },
  micBtn: {
    marginTop: 4,
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#EC4899',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnBusy: { backgroundColor: '#DB2777' },
  scoreText: { color: '#334155', fontSize: 13, fontFamily: FontFamily.medium },
  progressText: { color: '#7C3AED', fontSize: 12, fontFamily: FontFamily.bold },
});
