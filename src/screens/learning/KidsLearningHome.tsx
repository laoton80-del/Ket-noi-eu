import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeworkScanner } from '../../components/HomeworkScanner';
import type { RootStackParamList } from '../../navigation/routes';
import { assistKidsHomeworkFromImage } from '../../services/kidsHomework';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function KidsLearningHome() {
  const navigation = useNavigation<Nav>();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hw, setHw] = useState<{
    subject: string;
    explanation: string;
  } | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Kids Learning Home</Text>
        <Text style={styles.subtitle}>
          Khu học tiếng Việt cho bé (daily lesson, gamification, story mode).
        </Text>
        <Pressable
          onPress={() => navigation.navigate('Tabs', { screen: 'HocTap' })}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.86 }]}
        >
          <Text style={styles.ctaText}>Bắt đầu học</Text>
        </Pressable>
        <Pressable
          onPress={() => setScannerOpen(true)}
          style={({ pressed }) => [styles.cta, styles.scanCta, pressed && { opacity: 0.86 }]}
        >
          <Text style={styles.ctaText}>Quet bai tap cho be</Text>
        </Pressable>
        {loading ? <ActivityIndicator style={{ marginTop: 12 }} color="#2563EB" /> : null}
        {hw ? (
          <View style={styles.hwCard}>
            <Text style={styles.hwTitle}>Tro ly bai tap: {hw.subject}</Text>
            <Text style={styles.hwText}>{hw.explanation}</Text>
          </View>
        ) : null}
      </View>
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
    padding: 16,
  },
  card: {
    marginTop: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surface,
    padding: 14,
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
    marginBottom: 12,
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
  hwCard: {
    marginTop: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surfaceStrong,
    padding: 10,
  },
  hwTitle: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  hwText: {
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
});

