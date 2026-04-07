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
import type { RootStackParamList } from '../../navigation/routes';
import {
  createAdultRoleplaySession,
  resolveAdultScenario,
} from '../../services/ai/learningAI';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { useAuth } from '../../context/AuthContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AdultLearningHome() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [selectedSituation, setSelectedSituation] = useState<string | null>(null);

  const goHocTapForSituation = useCallback(
    (situation: string) => {
      setSelectedSituation(situation);
      // V1: mọi tình huống tạm mở Học tập; sau này có thể truyền params filter topic.
      navigation.navigate('Tabs', { screen: 'HocTap' });
    },
    [navigation]
  );

  const goVoicePractice = useCallback(async () => {
    try {
      const session = await createAdultRoleplaySession(
        resolveAdultScenario(selectedSituation),
        user?.phone
      );
      navigation.navigate('Tabs', {
        screen: 'LeTan',
        params: {
          aiMode: session.aiMode,
          scenario: session.scenario,
          initialPrompt: session.initialPrompt,
          proactiveQuestion: session.initialPrompt,
        },
      });
    } catch {
      navigation.navigate('Tabs', { screen: 'HocTap' });
    }
  }, [navigation, selectedSituation, user?.phone]);

  const onPressPhrase = useCallback(
    (phrase: string) => {
      navigation.navigate('Tabs', {
        screen: 'LeTan',
        params: {
          proactiveQuestion: `${phrase}. Tôi đang luyện phát âm, xin bạn trả lời từ từ.`,
        },
      });
    },
    [navigation]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Học tiếng bản địa</Text>
          <Text style={styles.screenSubtitle}>
            Tình huống thực tế · luyện nói · cụm từ nhanh
          </Text>
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
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  stack: {
    gap: 14,
  },
});
