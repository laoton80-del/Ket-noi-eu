import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KidsFlashcard } from '../../../components/academy/KidsFlashcard';
import { KidsMatchingGame } from '../../../components/academy/KidsMatchingGame';
import { TeacherAvatar, type TeacherEmotion } from '../../../components/academy/TeacherAvatar';
import { useAuth } from '../../../context/AuthContext';
import { formatVioPoints, getVioCreditsLabel } from '../../../core/monetization/vioDisplayLabels';
import { useTranslation } from '../../../i18n';
import type { RootStackParamList } from '../../../navigation/routes';
import { awardPoints } from '../../../services/loyalty/LoyaltyService';
import { KIDS_MODE_TOKENS } from '../../../theme/kidsModeTokens';
import { FontFamily } from '../../../theme/typography';
import { getLocalLanguageConfig } from '../../../utils/languageMapper';

export function VietKidsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeMode, setActiveMode] = useState<'flashcard' | 'game'>('flashcard');
  const [teacherEmotion, setTeacherEmotion] = useState<TeacherEmotion>('idle');
  const [showConfetti, setShowConfetti] = useState(false);
  const [rewardText, setRewardText] = useState<string | null>(null);
  const [awardedLevels, setAwardedLevels] = useState<Readonly<{ flashcard: boolean; game: boolean }>>({
    flashcard: false,
    game: false,
  });

  const creditsLabel = getVioCreditsLabel();

  const localLang = useMemo(() => {
    const items = getLocalLanguageConfig(user?.country ?? 'DE');
    return items.find((item) => item.code !== 'vi') ?? items[items.length - 1];
  }, [user?.country]);

  const awardForLevel = (kind: 'flashcard' | 'game') => {
    if (awardedLevels[kind]) return;
    const parentUserId = user?.phone ?? 'guest_parent';
    const award = awardPoints(parentUserId, 50, `Viet-Kids hoàn thành level ${kind}`);
    setAwardedLevels((prev) => ({ ...prev, [kind]: true }));
    setTeacherEmotion('praising');
    setShowConfetti(true);
    setRewardText(
      t('academySub.vietKids.rewardParent', {
        points: formatVioPoints(award.vigTokensAdded),
        credits: creditsLabel,
        mode:
          kind === 'flashcard'
            ? t('academySub.vietKids.rewardModeFlashcard')
            : t('academySub.vietKids.rewardModeGame'),
      })
    );
    setTimeout(() => {
      setShowConfetti(false);
      setTeacherEmotion('idle');
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.previewBadge}>{t('academySub.vietKids.previewBadge')}</Text>
          <Text style={styles.kicker}>{t('academySub.vietKids.kicker')}</Text>
          <Text style={styles.title}>{t('academySub.vietKids.title')}</Text>
          <Text style={styles.subtitle}>{t('academySub.vietKids.subtitle')}</Text>
          <Text style={styles.vioDisclaimer}>
            {t('academySub.vietKids.vioDisclaimer', { credits: creditsLabel })}
          </Text>
          <TeacherAvatar currentEmotion={teacherEmotion} />

          <View style={styles.modeWrap}>
            <Pressable
              style={({ pressed }) => [
                styles.modeBtn,
                activeMode === 'flashcard' && styles.modeBtnActive,
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => setActiveMode('flashcard')}
            >
              <Ionicons name="albums" size={16} color="#FFFFFF" />
              <Text style={styles.modeBtnText}>{t('academySub.vietKids.modeFlashcard')}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.modeBtn,
                styles.modeBtnGame,
                activeMode === 'game' && styles.modeBtnActiveGame,
                pressed && { opacity: 0.9 },
              ]}
              onPress={() => setActiveMode('game')}
            >
              <Ionicons name="game-controller" size={16} color="#FFFFFF" />
              <Text style={styles.modeBtnText}>{t('academySub.vietKids.modeGame')}</Text>
            </Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [styles.leaderboardBtn, pressed && { opacity: 0.9 }]}
            onPress={() => navigation.navigate('KidsLeaderboard')}
          >
            <Ionicons name="trophy" size={16} color="#FFFFFF" />
            <Text style={styles.leaderboardBtnText}>{t('academySub.vietKids.leaderboardCta')}</Text>
          </Pressable>
        </View>

        <View style={styles.modePanel}>
          {activeMode === 'flashcard' ? (
            <KidsFlashcard
              localLanguageCode={localLang.code}
              localLanguageLabel={localLang.label}
              onLevelComplete={() => awardForLevel('flashcard')}
              onEmotionChange={(emotion) => setTeacherEmotion((prev) => (prev === 'praising' ? prev : emotion))}
            />
          ) : (
            <KidsMatchingGame
              onLevelComplete={() => awardForLevel('game')}
              onEmotionChange={(emotion) => setTeacherEmotion((prev) => (prev === 'praising' ? prev : emotion))}
            />
          )}
        </View>

        {showConfetti ? (
          <View style={styles.celebrationCard}>
            <Text style={styles.celebrationEmoji}>🎉 🎊 ⭐</Text>
            <Text style={styles.celebrationTitle}>{t('academySub.vietKids.celebrationTitle')}</Text>
            <Text style={styles.celebrationText}>{rewardText}</Text>
            <Text style={styles.celebrationDisclaimer}>{t('academySub.common.notOfficialCert')}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: KIDS_MODE_TOKENS.colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 20,
    gap: 12,
  },
  heroCard: {
    borderRadius: 28,
    padding: 18,
    backgroundColor: KIDS_MODE_TOKENS.colors.panel,
    borderWidth: 2,
    borderColor: KIDS_MODE_TOKENS.colors.panelBorder,
    shadowColor: '#22D3EE',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  previewBadge: {
    alignSelf: 'flex-start',
    color: '#6D28D9',
    fontSize: 11,
    letterSpacing: 0.5,
    fontFamily: FontFamily.bold,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  kicker: { color: '#0F766E', fontSize: 12, letterSpacing: 0.6, fontFamily: FontFamily.bold },
  title: {
    color: KIDS_MODE_TOKENS.colors.textStrong,
    fontSize: KIDS_MODE_TOKENS.typography.titleSize,
    lineHeight: 34,
    fontFamily: FontFamily.extrabold,
    marginTop: 6,
  },
  subtitle: {
    color: '#155E75',
    fontSize: KIDS_MODE_TOKENS.typography.bodySize,
    lineHeight: 21,
    fontFamily: FontFamily.medium,
    marginTop: 8,
  },
  vioDisclaimer: {
    marginTop: 6,
    color: '#334155',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: FontFamily.medium,
  },
  modeWrap: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  modeBtn: {
    flex: 1,
    minHeight: KIDS_MODE_TOKENS.accessibility.minTouchTarget,
    borderRadius: 14,
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  modeBtnGame: { backgroundColor: '#0EA5E9' },
  modeBtnActive: {
    backgroundColor: '#6D28D9',
    borderWidth: 2,
    borderColor: '#DDD6FE',
  },
  modeBtnActiveGame: {
    backgroundColor: '#0369A1',
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  modeBtnText: { color: '#FFFFFF', fontSize: 12, fontFamily: FontFamily.bold },
  leaderboardBtn: {
    marginTop: 8,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  leaderboardBtnText: { color: '#FFFFFF', fontSize: 12, fontFamily: FontFamily.bold },
  modePanel: {
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFC',
    padding: 12,
  },
  celebrationCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 2,
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    gap: 4,
  },
  celebrationEmoji: { fontSize: 24 },
  celebrationTitle: { color: '#92400E', fontSize: 18, fontFamily: FontFamily.extrabold },
  celebrationText: { color: '#B45309', fontSize: 13, textAlign: 'center', fontFamily: FontFamily.medium },
  celebrationDisclaimer: {
    color: '#78350F',
    fontSize: 11,
    textAlign: 'center',
    fontFamily: FontFamily.medium,
    marginTop: 4,
  },
});
