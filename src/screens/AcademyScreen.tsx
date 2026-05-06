import { Pressable, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../components/ui/PrecisePanel';
import { useMiniAppEntry } from '../hooks/useMiniAppEntry';
import { getStrings } from '../i18n/strings';
import type { RootStackParamList } from '../navigation/routes';
import { useAssistantSettings } from '../state/assistantSettings';
import { useRegionState } from '../state/region';
import { theme } from '../theme/theme';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AcademyScreen() {
  const navigation = useNavigation<Nav>();
  const { openMiniApp } = useMiniAppEntry();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const { currentCountry, localCurrency } = useRegionState();
  return (
    <SafeAreaView style={styles.container}>
      <PrecisePanel style={styles.hero}>
        <Text style={styles.title}>{strings.nav.learningTab}</Text>
        <Text style={styles.subtitle}>
          {currentCountry} · {localCurrency}
        </Text>
        <Pressable
          style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          onPress={() => openMiniApp('academy', () => navigation.navigate('LiveAiTeacher'))}
        >
          <Text style={styles.ctaText}>{strings.learning.startPracticeWithChauLoan}</Text>
        </Pressable>
      </PrecisePanel>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  hero: {
    backgroundColor: theme.colors.executive.card,
    padding: 16,
  },
  title: {
    ...theme.typeScale.h1,
    color: theme.colors.SignatureGold,
  },
  subtitle: {
    marginTop: 8,
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
  },
  cta: {
    marginTop: 14,
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.SignatureGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.78,
  },
  ctaText: {
    color: theme.colors.DeepInkNavy,
    ...theme.typeScale.caption,
    fontFamily: theme.typeScale.h2.fontFamily,
  },
});
