import { useCallback, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  QuickPhrasesCard,
  SituationGrid,
  SuggestedLessonCard,
  VoicePracticeCard,
} from '../../components/learning/adult';
import { useTranslation } from '../../i18n';
import type { RootStackParamList } from '../../navigation/routes';
import {
  createAdultRoleplaySession,
  resolveAdultScenario,
} from '../../services/ai/learningAI';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';
import { useSyncHubOnFocus } from '../../hooks/useSyncHubOnFocus';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AdultLearningHome() {
  useSyncHubOnFocus('HUB_ACADEMY');
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);

  const goHocTapForSituation = useCallback(
    (situation: string) => {
      setSelectedSituation(situation);
      // V1: mọi tình huống tạm mở Học tập; sau này có thể truyền params filter topic.
      navigation.navigate('Tabs', { screen: 'TabHome' });
    },
    [navigation]
  );

  const goVoicePractice = useCallback(async () => {
    try {
      const session = await createAdultRoleplaySession(
        resolveAdultScenario(selectedSituation),
        user?.phone
      );
      navigation.navigate('LiveAiTeacher', {
        scenarioLabel: session.scenario,
        practiceFocus: session.initialPrompt,
      });
    } catch {
      navigation.navigate('Tabs', { screen: 'TabHome' });
    }
  }, [navigation, selectedSituation, user?.phone]);

  const onPressPhrase = useCallback(
    (phrase: string) => {
      navigation.navigate('LiveAiTeacher', {
        practiceFocus: t('academySub.adult.practiceFocusTemplate', { phrase }),
      });
    },
    [navigation, t]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.liteBadge}>{t('academySub.common.litePilotBadge')}</Text>
          <Text style={styles.screenTitle}>{t('academySub.adult.title')}</Text>
          <Text style={styles.screenSubtitle}>{t('academySub.adult.subtitle')}</Text>
          <Text style={styles.disclaimer}>{t('academySub.adult.disclaimer')}</Text>
        </View>

        <View style={styles.stack}>
          <SuggestedLessonCard
            situationLabel={selectedSituation ?? undefined}
            onPressStudyNow={goHocTapForSituation}
          />
          <SituationGrid onPressSituation={goHocTapForSituation} />
          <VoicePracticeCard onPressStart={goVoicePractice} />
          <QuickPhrasesCard onPressPhrase={onPressPhrase} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 14,
    gap: 4,
  },
  liteBadge: {
    alignSelf: 'flex-start',
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#6D28D9',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  screenSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  disclaimer: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  stack: {
    gap: 14,
  },
});
