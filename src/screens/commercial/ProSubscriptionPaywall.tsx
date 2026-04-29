import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOSLottiePlayer } from '../../components/ui/SOSLottiePlayer';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

const PRO_FEATURES = [
  'Phân tích doanh thu AI',
  'Phát hành Thẻ Quà Tặng',
  'Bắn quảng cáo bán kính 5km',
] as const;

const CROWN_LOTTIE_URI = 'https://assets4.lottiefiles.com/packages/lf20_2cwDXD.json';

export function ProSubscriptionPaywall() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <SOSLottiePlayer source={{ uri: CROWN_LOTTIE_URI }} style={styles.heroAnimation} />
          <Text style={styles.heroTitle}>Kết Nối Global PRO</Text>
          <Text style={styles.heroSubtitle}>
            Mở khóa Merchant Dashboard và toàn bộ không gian B2B với tier Pro, Power hoặc Enterprise.
          </Text>
        </View>

        <View style={styles.featureCard}>
          {PRO_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Pressable style={({ pressed }) => [styles.ctaButton, pressed && { opacity: 0.9 }]}>
          <Text style={styles.ctaText}>Nâng cấp lên Pro/Power để mở khóa B2B Workspace</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.backgroundDeep,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  heroCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.card,
    alignItems: 'center',
    padding: theme.spacing.lg,
    gap: theme.spacing.sm,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.modal.shadowOffset,
    shadowOpacity: theme.elevation.modal.shadowOpacity,
    shadowRadius: theme.elevation.modal.shadowRadius,
    elevation: theme.elevation.modal.elevation,
  },
  heroAnimation: {
    width: 180,
    height: 180,
  },
  heroTitle: {
    ...theme.typeScale.h1,
    fontFamily: FontFamily.bold,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  featureCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  featureText: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.semibold,
    flex: 1,
  },
  ctaButton: {
    marginTop: theme.spacing.sm,
    minHeight: theme.components.button.height.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalStrong,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  ctaText: {
    ...theme.typeScale.body,
    color: theme.hybrid.onSignal,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
});
