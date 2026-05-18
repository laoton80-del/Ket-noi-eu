import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeworkScanner } from '../../components/HomeworkScanner';
import { useTranslation } from '../../i18n';
import type { RootStackParamList } from '../../navigation/routes';
import { assistKidsHomeworkFromImage } from '../../services/kidsHomework';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function KidsLearningHome() {
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hw, setHw] = useState<{
    subject: string;
    explanation: string;
  } | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.liteBadge}>{t('academySub.kidsHome.liteBadge')}</Text>
          <Text style={styles.title}>{t('academySub.kidsHome.title')}</Text>
          <Text style={styles.subtitle}>{t('academySub.kidsHome.subtitle')}</Text>
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimer}>{t('academySub.kidsHome.disclaimer')}</Text>
            <Text style={styles.disclaimer}>{t('academySub.common.parentSupervision')}</Text>
            <Text style={styles.disclaimer}>{t('academySub.common.notSchoolAdvice')}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('Tabs', { screen: 'TabHome' })}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.86 }]}
          >
            <Text style={styles.ctaText}>{t('academySub.kidsHome.startLearning')}</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('VietKids')}
            style={({ pressed }) => [styles.cta, styles.vietKidsCta, pressed && { opacity: 0.86 }]}
          >
            <Text style={styles.ctaText}>{t('academySub.kidsHome.openVietKids')}</Text>
          </Pressable>
          <Pressable
            onPress={() => setScannerOpen(true)}
            style={({ pressed }) => [styles.cta, styles.scanCta, pressed && { opacity: 0.86 }]}
          >
            <Text style={styles.ctaText}>{t('academySub.kidsHome.scanHomework')}</Text>
          </Pressable>
          {loading ? <ActivityIndicator style={{ marginTop: 12 }} color="#2563EB" /> : null}
          {hw ? (
            <View style={styles.hwCard}>
              <Text style={styles.hwTitle}>
                {t('academySub.kidsHome.homeworkResultTitle', { subject: hw.subject })}
              </Text>
              <Text style={styles.hwText}>{hw.explanation}</Text>
              <Text style={styles.hwDisclaimer}>{t('academySub.common.notSchoolAdvice')}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
      <HomeworkScanner
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onCaptured={(base64Image) => {
          setScannerOpen(false);
          setLoading(true);
          void (async () => {
            try {
              const r = await assistKidsHomeworkFromImage({ base64Image, withVoice: false });
              setHw({ subject: r.subject, explanation: r.explanation });
            } finally {
              setLoading(false);
            }
          })();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  card: {
    marginTop: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surface,
    padding: 14,
  },
  liteBadge: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: '#6D28D9',
    letterSpacing: 0.35,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginBottom: 10,
  },
  disclaimerBox: {
    gap: 4,
    marginBottom: 12,
    padding: 10,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surfaceStrong,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 18,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
  cta: {
    minHeight: 42,
    borderRadius: theme.radius.sm,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bold,
  },
  scanCta: {
    marginTop: 10,
    backgroundColor: '#0F766E',
  },
  vietKidsCta: {
    marginTop: 10,
    backgroundColor: '#7C3AED',
  },
  hwCard: {
    marginTop: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surfaceStrong,
    padding: 10,
    gap: 6,
  },
  hwTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  hwText: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  hwDisclaimer: {
    fontSize: 11,
    lineHeight: 16,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
});
