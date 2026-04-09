import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Audio } from 'expo-av';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated as RNAnimated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashcardItem } from '../components/FlashcardItem';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/routes';
import { FREE_A1_A2_CARDS } from '../state/freeLearningCards';
import { useFlashcardState } from '../state/flashcards';
import { reserveAndCommitCredits, syncWalletFromServer, useWalletState } from '../state/wallet';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { Colors } from '../theme/colors';
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
const LEARNING_UNLOCK_COST = 999;

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
  const loadB1B2UnlockState = async () => {
    try {
      const stored = await AsyncStorage.getItem(B1_B2_UNLOCK_STORAGE_KEY);
      const unlocked = user?.isLearningFullUnlocked === true || user?.isLearningUnlocked === true || stored === 'true';
      setIsLearningFullUnlocked(unlocked);
    } catch {
      setIsLearningFullUnlocked(user?.isLearningFullUnlocked === true || user?.isLearningUnlocked === true);
    }
  };

  useEffect(() => {
    void loadB1B2UnlockState();
  }, [user?.isLearningFullUnlocked, user?.isLearningUnlocked]);

  const showLearningSalesSheet = () => {
    Alert.alert(
      'Mở Khóa Trọn Bộ Tri Thức Global',
      '999 Credits — mở khóa vĩnh viễn: giáo trình A1–B2 + phát âm (giọng tổng hợp) không giới hạn.',
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Nâng cấp ngay - 999 Credits',
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
      Alert.alert('Hết Credits', 'Bạn cần 999 Credits để mở khóa gói Học Tập.');
      navigation.navigate('Wallet');
      return;
    }
    setUnlockLoading(true);
    try {
      await syncWalletFromServer();
      const deducted = await reserveAndCommitCredits(LEARNING_UNLOCK_COST, `learning-unlock-${Date.now()}`);
      if (!deducted.ok) {
        Alert.alert('Hết Credits', 'Bạn cần 999 Credits để mở khóa gói Học Tập.');
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
          <Text style={styles.creditBadgeText}>{wallet.credits} Credits</Text>
        </View>
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
        <FlatList
          data={filteredCards}
          keyExtractor={(item) => item.id}
          numColumns={2}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
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
              <Text style={styles.unlockBtnText}>Nâng cấp ngay - 999 Credits</Text>
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




