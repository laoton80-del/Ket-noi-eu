import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashcardItem } from '../components/FlashcardItem';
import { OptimizedFlatList } from '../components/ui/OptimizedFlatList';
import {
  AI_TEACHER_INCLUDED_MINUTES_PER_MONTH,
  AI_TEACHER_OVERAGE_PER_MIN_CREDITS,
  AI_TEACHER_PREMIUM_USD,
  PRICING_BASELINE_CURRENCY,
  PRICING_AUTHORITY,
} from '../config/pricingConfig';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { FREE_A1_A2_CARDS } from '../state/freeLearningCards';
import { useFlashcardState } from '../state/flashcards';
import { reserveAndCommitCredits, syncWalletFromServer, useWalletState } from '../state/wallet';
import { GEMINI_TEACHER_BADGE_LABEL } from '../services/ai/GeminiTeacherService';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { applyWebStyles } from '../utils/applyWebStyles';
import { formatCurrency } from '../utils/currencyFormatter';
import { Colors } from '../theme/colors';
import { b2cTheme } from '../theme/appModeThemes';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';
import { generateSpeech } from '../services/OpenAIService';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type TimeFilter = 'today' | 'week' | 'older';
type PremiumLesson = {
  id: string;
  level: 'B1' | 'B2';
  title: string;
  summary: string;
};
type LearningCard = {
  id: string;
  prompt: string;
  targetWord: string;
  phonetic?: string;
  knowledge: string;
  createdAt: string;
  level: 'A1' | 'A2' | 'custom';
};

const PREMIUM_LESSONS: PremiumLesson[] = [
  {
    id: 'b1-dialogue',
    level: 'B1',
    title: 'B1 - Hội thoại công việc',
    summary: 'Mẫu đàm thoại khi xin nghỉ phép, trao đổi lịch và trình bày vấn đề.',
  },
  {
    id: 'b2-writing',
    level: 'B2',
    title: 'B2 - Viết email chuyên nghiệp',
    summary: 'Cách viết email phản hồi khách hàng, nhấn tone lịch sự theo ngữ cảnh EU.',
  },
];

const B1_B2_UNLOCK_STORAGE_KEY = STORAGE_KEYS.learningB1B2Unlocked;
const AI_TEACHER_USAGE_STORAGE_KEY = STORAGE_KEYS.learningAiTeacherUsageMonth;
const LEARNING_UNLOCK_COST = PRICING_AUTHORITY.b2cCredits.learningUnlockCredits;

type AiTeacherUsageRecord = { month: string; usedMinutes: number };

function currentBillingMonthId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return `${y}-${m < 10 ? `0${m}` : m}`;
}

function formatRemainingHoursMinutes(remainingMinutes: number): string {
  const safe = Math.max(0, Math.floor(remainingMinutes));
  const h = Math.floor(safe / 60);
  const min = safe % 60;
  if (h <= 0) return `${min} phút`;
  if (min === 0) return `${h} giờ`;
  return `${h} giờ ${min} phút`;
}

export function HocTapScreen() {
  const navigation = useNavigation<Nav>();
  const { user, updateProfile } = useAuth();
  const wallet = useWalletState();
  const pulse = useRef(new RNAnimated.Value(1)).current;
  const { cards } = useFlashcardState();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [isLearningFullUnlocked, setIsLearningFullUnlocked] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [aiTeacherUsedMinutesMonth, setAiTeacherUsedMinutesMonth] = useState(0);

  useEffect(() => {
    const loop = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulse, {
          toValue: 1.08,
          duration: 780,
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulse, {
          toValue: 1,
          duration: 780,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;
  const scannedCards: LearningCard[] = cards.map((item) => ({
    id: item.id,
    prompt: item.prompt,
    targetWord: item.meaning,
    knowledge: item.knowledge,
    createdAt: item.createdAt,
    level: 'custom',
  }));
  const seededCards: LearningCard[] = FREE_A1_A2_CARDS.map((item) => {
    const id = item.id.toLowerCase();
    const level: LearningCard['level'] = id.startsWith('a1-') ? 'A1' : 'A2';
    return { ...item, level };
  });
  const learningCards: LearningCard[] = [...scannedCards, ...seededCards];
  const a1Cards = learningCards.filter((item) => item.level === 'A1');
  const a1FreeLimit = Math.max(1, Math.ceil(a1Cards.length / 2));
  const freeA1Set = new Set(a1Cards.slice(0, a1FreeLimit).map((item) => item.id));
  const filteredCards = learningCards.filter((item) => {
    const diff = now - new Date(item.createdAt).getTime();
    if (timeFilter === 'today') return diff <= oneDay;
    if (timeFilter === 'week') return diff > oneDay && diff <= sevenDays;
    return diff > sevenDays;
  });
  const loadB1B2UnlockState = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(B1_B2_UNLOCK_STORAGE_KEY);
      const unlocked = user?.isLearningFullUnlocked === true || user?.isLearningUnlocked === true || stored === 'true';
      setIsLearningFullUnlocked(unlocked);
    } catch {
      setIsLearningFullUnlocked(user?.isLearningFullUnlocked === true || user?.isLearningUnlocked === true);
    }
  }, [user?.isLearningFullUnlocked, user?.isLearningUnlocked]);

  useEffect(() => {
    void loadB1B2UnlockState();
  }, [loadB1B2UnlockState]);

  const loadAiTeacherUsage = useCallback(async () => {
    const month = currentBillingMonthId();
    try {
      const raw = await AsyncStorage.getItem(AI_TEACHER_USAGE_STORAGE_KEY);
      if (!raw) {
        setAiTeacherUsedMinutesMonth(0);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'month' in parsed &&
        'usedMinutes' in parsed &&
        typeof (parsed as AiTeacherUsageRecord).month === 'string' &&
        typeof (parsed as AiTeacherUsageRecord).usedMinutes === 'number'
      ) {
        const rec = parsed as AiTeacherUsageRecord;
        setAiTeacherUsedMinutesMonth(rec.month === month ? Math.max(0, rec.usedMinutes) : 0);
        return;
      }
      setAiTeacherUsedMinutesMonth(0);
    } catch {
      setAiTeacherUsedMinutesMonth(0);
    }
  }, []);

  useEffect(() => {
    void loadAiTeacherUsage();
  }, [loadAiTeacherUsage]);

  const subscriptionPlan = user?.subscriptionPlan ?? 'free';
  const showAiTeacherRemaining =
    subscriptionPlan === 'premium' || subscriptionPlan === 'combo';
  const aiTeacherRemainingMinutes = Math.max(
    0,
    AI_TEACHER_INCLUDED_MINUTES_PER_MONTH - aiTeacherUsedMinutesMonth
  );
  const aiTeacherIncludedHoursDisplay = Math.round(AI_TEACHER_INCLUDED_MINUTES_PER_MONTH / 60);

  const showLearningSalesSheet = () => {
    Alert.alert(
      'Mở Khóa Trọn Bộ Tri Thức Global',
      `${LEARNING_UNLOCK_COST} VIG Token — mở khóa vĩnh viễn: giáo trình A1–B2 + phát âm (giọng tổng hợp) không giới hạn.`,
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: `Nâng cấp ngay - ${LEARNING_UNLOCK_COST} VIG Token`,
          onPress: () => {
            void onUnlockLearning();
          },
        },
      ]
    );
  };

  useEffect(() => {
    return () => {
      void (async () => {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
      })();
    };
  }, []);

  const onPressAudio = async (card: LearningCard) => {
    if (!isLearningFullUnlocked) {
      showLearningSalesSheet();
      return;
    }
    try {
      const speechPath = await generateSpeech(card.targetWord, 'nova');
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      const { sound } = await Audio.Sound.createAsync({ uri: speechPath }, { shouldPlay: true });
      soundRef.current = sound;
    } catch {
      Alert.alert('Phát âm', 'Không thể phát âm lúc này. Vui lòng thử lại sau.');
    }
  };

  const onUnlockLearning = async () => {
    if (unlockLoading || isLearningFullUnlocked) return;
    if (wallet.credits < LEARNING_UNLOCK_COST) {
      Alert.alert('Thiếu VIG Token', `Bạn cần ${LEARNING_UNLOCK_COST} VIG Token để mở khóa gói Học Tập.`);
      navigation.navigate('Wallet');
      return;
    }
    setUnlockLoading(true);
    try {
      await syncWalletFromServer();
      const deducted = await reserveAndCommitCredits(LEARNING_UNLOCK_COST, `learning-unlock-${Date.now()}`);
      if (!deducted.ok) {
        Alert.alert('Thiếu VIG Token', `Bạn cần ${LEARNING_UNLOCK_COST} VIG Token để mở khóa gói Học Tập.`);
        navigation.navigate('Wallet');
        return;
      }
      await AsyncStorage.setItem(B1_B2_UNLOCK_STORAGE_KEY, 'true');
      setIsLearningFullUnlocked(true);
      if (user) {
        updateProfile({ isLearningFullUnlocked: true, isLearningUnlocked: true });
      }
      Alert.alert('Đã mở khóa', 'Bạn đã mở khóa trọn bộ B1–B2 và nghe phát âm vĩnh viễn.');
    } finally {
      setUnlockLoading(false);
    }
  };

  if (learningCards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyWrap}>
          <View style={styles.chestOrb}>
            <Ionicons name="file-tray-full" size={54} color="#B6852D" />
          </View>
          <Text style={styles.emptyText}>
            Kho báu tri thức đang chờ bé khám phá. Dùng Mắt Thần để quét bài tập nhé!
          </Text>
          <Pressable
            onPress={() => navigation.navigate('AiEye')}
            style={({ pressed }) => [styles.openAiEyeBtn, pressed && { opacity: 0.9 }]}
          >
            <RNAnimated.View style={{ transform: [{ scale: pulse }] }}>
              <Text style={styles.openAiEyeText}>Mở Mắt Thần</Text>
            </RNAnimated.View>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kho Flashcards 3D</Text>
        <Text style={styles.subtitle}>Chạm để lật thẻ và ôn luyện cùng bé</Text>
        {!isLearningFullUnlocked ? (
          <View style={styles.freeTierChip}>
            <Ionicons name="information-circle" size={13} color="#8A6A1A" />
            <Text style={styles.freeTierChipText}>Free: 1/2 A1 (text-only)</Text>
          </View>
        ) : null}
        <View style={styles.creditBadge}>
          <Ionicons name="wallet" size={14} color="#B6852D" />
          <Text style={styles.creditBadgeText}>{wallet.credits} VIG Token</Text>
        </View>
      </View>

      <View
        style={[
          styles.aiTeacherUpsell,
          { backgroundColor: b2cTheme.colors.card, borderColor: b2cTheme.colors.border },
        ]}
      >
        <View style={styles.aiTeacherUpsellHeader}>
          <Ionicons name="sparkles" size={20} color={b2cTheme.colors.primary} />
          <Text style={styles.aiTeacherUpsellTitle}>Thẻ Học Giả — Premium Learner</Text>
        </View>
        <View style={styles.geminiBadgeWrap} className={applyWebStyles('kn-neon-b2b')}>
          <Ionicons name="eye" size={14} color={b2cTheme.colors.primary} />
          <Text style={styles.geminiBadgeText}>{GEMINI_TEACHER_BADGE_LABEL}</Text>
        </View>
        <Text style={styles.aiTeacherEngineLine}>
          Động cơ AI Giáo viên: Google Gemini — đa phương tiện (giọng nói, camera bảng, chia sẻ màn hình).
        </Text>
        <Text style={styles.aiTeacherUpsellPrice}>
          Thẻ Học Giả: {formatCurrency(AI_TEACHER_PREMIUM_USD, PRICING_BASELINE_CURRENCY)} / tháng
        </Text>
        <Text style={styles.aiTeacherUpsellQuota}>
          Fair-use AI Giáo viên: {aiTeacherIncludedHoursDisplay} giờ đồng hồ / tháng trong gói; vượt mức:{' '}
          {AI_TEACHER_OVERAGE_PER_MIN_CREDITS} VIG Token / phút.
        </Text>
        {showAiTeacherRemaining ? (
          <Text style={styles.aiTeacherUpsellRemaining}>
            Còn lại (ước lượng tháng này): {formatRemainingHoursMinutes(aiTeacherRemainingMinutes)}
          </Text>
        ) : null}
        <Text style={styles.aiTeacherUpsellHero}>
          Luyện hội thoại không giới hạn 24/7 — Unlimited 24/7 speaking practice.
        </Text>
        <Text style={styles.aiTeacherUpsellHighlight}>
          Nhập vai tình huống thực tế — Real-life roleplay scenarios.
        </Text>
        <Text style={styles.aiTeacherUpsellFine}>
          Gói đăng ký riêng; phù hợp người học muốn lịch ôn linh hoạt cùng AI.
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Wallet')}
          style={({ pressed }) => [styles.aiTeacherUpsellCta, pressed && { opacity: 0.88 }]}
        >
          <Text style={styles.aiTeacherUpsellCtaText}>Xem gói nạp & đăng ký</Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        {(['today', 'week', 'older'] as TimeFilter[]).map((key) => (
          <Pressable
            key={key}
            onPress={() => setTimeFilter(key)}
            style={({ pressed }) => [
              styles.filterChip,
              timeFilter === key && styles.filterChipActive,
              pressed && { opacity: 0.84 },
            ]}
          >
            <Text style={[styles.filterText, timeFilter === key && styles.filterTextActive]}>
              {key === 'today' ? 'Hôm nay' : key === 'week' ? 'Tuần này' : 'Cũ hơn'}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.gridShell}>
        <OptimizedFlatList
          data={filteredCards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          renderItem={({ item }) => (
            (() => {
              const contentUnlocked = isLearningFullUnlocked || (item.level === 'A1' && freeA1Set.has(item.id));
              return (
            <FlashcardItem
              prompt={item.prompt}
              targetWord={item.targetWord}
              phonetic={item.phonetic}
              knowledge={item.knowledge}
              audioUnlocked={isLearningFullUnlocked}
              contentUnlocked={contentUnlocked}
              onPressLockedContent={() => {
                showLearningSalesSheet();
              }}
              onPressAudio={() => {
                void onPressAudio(item);
              }}
            />
              );
            })()
          )}
          ListEmptyComponent={<Text style={styles.emptyListText}>Không có thẻ trong nhóm này.</Text>}
        />
      </View>

      <View style={styles.premiumWrap}>
        <Text style={styles.premiumHeading}>Học nâng cao B1-B2</Text>
        {PREMIUM_LESSONS.map((lesson) => (
          <View key={lesson.id} style={styles.premiumCard}>
            <View style={styles.premiumLevelChip}>
              <Text style={styles.premiumLevelText}>{lesson.level}</Text>
            </View>
            <View style={styles.premiumBody}>
              <Text style={styles.premiumTitle}>{lesson.title}</Text>
              <Text style={styles.premiumSummary}>{lesson.summary}</Text>
            </View>
            {!isLearningFullUnlocked ? (
              <Ionicons name="lock-closed" size={18} color="#A63F3F" />
            ) : (
              <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
            )}
          </View>
        ))}
        {!isLearningFullUnlocked ? (
          <Pressable onPress={() => void showLearningSalesSheet()} style={({ pressed }) => [styles.unlockBtn, pressed && { opacity: 0.88 }]}>
            {unlockLoading ? (
              <View style={styles.unlockLoading}>
                <ActivityIndicator size="small" color="#FFECD4" />
                <Text style={styles.unlockBtnText}>Đang xử lý mở khóa...</Text>
              </View>
            ) : (
              <Text style={styles.unlockBtnText}>Nâng cấp ngay - {LEARNING_UNLOCK_COST} VIG Token</Text>
            )}
          </Pressable>
        ) : (
          <Text style={styles.premiumUnlocked}>Bạn đã mở khóa trọn bộ học tập và phát âm vĩnh viễn.</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    color: Colors.text,
    fontFamily: FontFamily.extrabold,
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
  },
  aiTeacherUpsell: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    gap: theme.spacing.xs,
  },
  aiTeacherUpsellHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  geminiBadgeWrap: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing.xs,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  geminiBadgeText: {
    fontSize: theme.typeScale.caption.fontSize,
    fontFamily: FontFamily.bold,
    color: b2cTheme.colors.primary,
    letterSpacing: 0.2,
  },
  aiTeacherEngineLine: {
    marginTop: theme.spacing.xs,
    fontSize: theme.typeScale.caption.fontSize,
    fontFamily: FontFamily.regular,
    color: 'rgba(11, 22, 40, 0.72)',
    lineHeight: (theme.typeScale.caption.lineHeight ?? 16) * 1.35,
  },
  aiTeacherUpsellTitle: {
    fontSize: theme.typeScale.h2.fontSize,
    fontFamily: FontFamily.extrabold,
    color: b2cTheme.colors.text,
    flex: 1,
  },
  aiTeacherUpsellPrice: {
    fontSize: theme.typeScale.h1.fontSize,
    fontFamily: FontFamily.bold,
    color: b2cTheme.colors.primary,
  },
  aiTeacherUpsellQuota: {
    fontSize: theme.typeScale.caption.fontSize + 1,
    fontFamily: FontFamily.semibold,
    color: 'rgba(11, 22, 40, 0.78)',
    lineHeight: (theme.typeScale.caption.lineHeight ?? 16) * 1.35,
  },
  aiTeacherUpsellRemaining: {
    fontSize: theme.typeScale.caption.fontSize + 1,
    fontFamily: FontFamily.bold,
    color: '#2E7D32',
    lineHeight: (theme.typeScale.caption.lineHeight ?? 16) * 1.35,
  },
  aiTeacherUpsellHero: {
    fontSize: theme.typeScale.body.fontSize + 1,
    fontFamily: FontFamily.extrabold,
    color: b2cTheme.colors.text,
    lineHeight: (theme.typeScale.body.lineHeight ?? 22) + 4,
  },
  aiTeacherUpsellHighlight: {
    fontSize: theme.typeScale.body.fontSize,
    fontFamily: FontFamily.semibold,
    color: b2cTheme.colors.text,
  },
  aiTeacherUpsellFine: {
    fontSize: theme.typeScale.caption.fontSize,
    fontFamily: FontFamily.regular,
    color: 'rgba(11, 22, 40, 0.62)',
    lineHeight: theme.typeScale.caption.lineHeight * 1.25,
  },
  aiTeacherUpsellCta: {
    marginTop: theme.spacing.sm,
    minHeight: 44,
    borderRadius: theme.radius.md,
    backgroundColor: b2cTheme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTeacherUpsellCtaText: {
    fontSize: theme.typeScale.body.fontSize,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  creditBadge: {
    alignSelf: 'flex-end',
    marginTop: 8,
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.42)',
    backgroundColor: 'rgba(255,251,242,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditBadgeText: {
    fontSize: 12,
    color: '#3E2E1B',
    fontFamily: FontFamily.semibold,
  },
  freeTierChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    minHeight: 26,
    paddingHorizontal: 9,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(199,154,50,0.45)',
    backgroundColor: 'rgba(245,212,122,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  freeTierChipText: {
    fontSize: 11,
    color: '#8A6A1A',
    fontFamily: FontFamily.semibold,
  },
  filterRow: {
    paddingHorizontal: 16,
    marginBottom: 6,
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    minHeight: 32,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
    backgroundColor: 'rgba(255,251,242,0.48)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: 'rgba(212,175,55,0.24)',
    borderColor: 'rgba(212,175,55,0.52)',
  },
  filterText: {
    fontSize: 12,
    color: Colors.textSoft,
    fontFamily: FontFamily.medium,
  },
  filterTextActive: {
    color: Colors.text,
    fontFamily: FontFamily.semibold,
  },
  gridShell: {
    minHeight: 280,
    transform: [{ perspective: 1000 }, { rotateX: '5deg' }],
  },
  gridContent: {
    paddingHorizontal: 14,
    paddingBottom: 110,
    paddingTop: 8,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  chestOrb: {
    width: 126,
    height: 126,
    borderRadius: 63,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,251,242,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.45)',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
    marginBottom: 14,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
    color: '#4F4336',
    fontFamily: FontFamily.medium,
    marginBottom: 16,
  },
  openAiEyeBtn: {
    minWidth: 176,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.56)',
    backgroundColor: '#C83D3D',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B7355',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 4,
  },
  openAiEyeText: {
    color: '#FFECD4',
    fontSize: 15,
    fontFamily: FontFamily.bold,
  },
  emptyListText: {
    marginTop: 22,
    textAlign: 'center',
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
    fontSize: 13,
  },
  premiumWrap: {
    marginTop: 4,
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
    backgroundColor: 'rgba(255,251,242,0.55)',
  },
  premiumHeading: {
    fontSize: 16,
    color: Colors.text,
    fontFamily: FontFamily.extrabold,
    marginBottom: 10,
  },
  premiumCard: {
    minHeight: 64,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.24)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  premiumLevelChip: {
    minWidth: 36,
    height: 24,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(166,63,63,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(166,63,63,0.35)',
  },
  premiumLevelText: {
    fontSize: 11,
    color: '#A63F3F',
    fontFamily: FontFamily.bold,
  },
  premiumBody: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: FontFamily.bold,
    marginBottom: 2,
  },
  premiumSummary: {
    fontSize: 12,
    color: Colors.textSoft,
    fontFamily: FontFamily.regular,
    lineHeight: 17,
  },
  unlockBtn: {
    marginTop: 4,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C83D3D',
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.56)',
  },
  unlockLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unlockBtnText: {
    fontSize: 13,
    color: '#FFECD4',
    fontFamily: FontFamily.bold,
  },
  premiumUnlocked: {
    marginTop: 4,
    fontSize: 12,
    color: '#2E7D32',
    fontFamily: FontFamily.semibold,
  },
});




