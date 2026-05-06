import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuantumShieldBadge } from '../components/security/QuantumShieldBadge';
import { PrecisePanel } from '../components/ui/PrecisePanel';
import { StatusChip } from '../components/ui/StatusChip';
import { getStrings } from '../i18n/strings';
import type { RootStackParamList } from '../navigation/routes';
import { useAssistantSettings } from '../state/assistantSettings';
import { useRegionState } from '../state/region';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

const routes = [
  { id: 'sg-ny-1', title: 'Route: SG-NY Express', phase: 'Origin → Transit → Customs → Terminal', status: 'Processing' as const },
  { id: 'sg-ny-2', title: 'Route: SG-NY Express #2', phase: 'Origin → Transit → Customs → Terminal', status: 'Pending' as const },
  { id: 'sg-eu-1', title: 'Route: SG-EU Priority', phase: 'Origin → Transit → Destination', status: 'Cleared' as const },
];

export function ConciergeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { languageCode } = useAssistantSettings();
  const strings = getStrings(languageCode);
  const { currentCountry, localCurrency } = useRegionState();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PrecisePanel style={styles.headerPanel}>
          <Text style={styles.title}>{strings.nav.receptionTab}</Text>
          <Text style={styles.subtitle}>
            {currentCountry} · {localCurrency}
          </Text>
        </PrecisePanel>

        <PrecisePanel style={styles.metricsRow}>
          <PrecisePanel style={[styles.metricCard, styles.metricBlue]}>
            <Text style={styles.metricValue}>Operational</Text>
            <Text style={styles.metricMeta}>Normal Traffic</Text>
          </PrecisePanel>
          <PrecisePanel style={[styles.metricCard, styles.metricAmber]}>
            <Text style={styles.metricValue}>14</Text>
            <Text style={styles.metricMeta}>Pending</Text>
          </PrecisePanel>
          <PrecisePanel style={[styles.metricCard, styles.metricGreen]}>
            <Text style={styles.metricValue}>03</Text>
            <Text style={styles.metricMeta}>Verified</Text>
          </PrecisePanel>
        </PrecisePanel>

        <PrecisePanel style={styles.assistantCard}>
          <Text style={styles.assistantTitle}>Minh Khang Assistant</Text>
          <Text style={styles.assistantHint}>
            Mở hội thoại để bắt đầu hỗ trợ theo ngữ cảnh, sau đó chuyển nhanh sang phiên dịch hoặc gọi hỗ trợ.
          </Text>
          <QuantumShieldBadge compact />
          <View style={styles.assistantActions}>
            <Pressable
              onPress={() => navigation.navigate('AssistantChat')}
              style={({ pressed }) => [styles.primaryActionBtn, pressed && { opacity: 0.86 }]}
            >
              <Text style={styles.primaryActionText}>Trò chuyện với Trợ lý</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('InboundQueue')}
              style={({ pressed }) => [styles.secondaryActionBtn, pressed && { opacity: 0.86 }]}
            >
              <Text style={styles.secondaryActionText}>Hàng chờ yêu cầu vào</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('SmartCalendar')}
              style={({ pressed }) => [styles.secondaryActionBtn, pressed && { opacity: 0.86 }]}
            >
              <Text style={styles.secondaryActionText}>Lịch thông minh</Text>
            </Pressable>
          </View>
        </PrecisePanel>

        <Text style={styles.sectionTitle}>{strings.utility.serviceTravel}</Text>
        <PrecisePanel style={styles.routesList}>
          {routes.map((route) => (
            <PrecisePanel key={route.id}>
              <View style={styles.routeHead}>
                <Text style={styles.routeTitle}>{route.title}</Text>
                <StatusChip state={route.status} />
              </View>
              <Text style={styles.routeMeta}>{route.phase}</Text>
            </PrecisePanel>
          ))}
        </PrecisePanel>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.DeepInkNavy,
  },
  content: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 20,
  },
  headerPanel: {
    marginBottom: 10,
    backgroundColor: theme.colors.executive.card,
  },
  title: {
    ...theme.typeScale.h1,
    color: theme.colors.SignatureGold,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: theme.colors.executive.card,
    marginBottom: 10,
  },
  metricCard: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  metricBlue: {
    backgroundColor: theme.hybrid.chipProcessingBg,
    borderColor: theme.hybrid.signalSubtleBorder,
  },
  metricAmber: {
    backgroundColor: theme.colors.executive.panelMuted,
    borderColor: theme.colors.PendingAmber,
  },
  metricGreen: {
    backgroundColor: theme.hybrid.chipClearedBg,
    borderColor: theme.colors.SoftEmerald,
  },
  metricValue: {
    ...theme.typeScale.h2,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.bold,
  },
  metricMeta: {
    marginTop: 2,
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  sectionTitle: {
    marginTop: 14,
    marginBottom: 8,
    ...theme.typeScale.h2,
    color: theme.colors.SignatureGold,
    fontFamily: FontFamily.bold,
  },
  routesList: {
    gap: 10,
    backgroundColor: theme.colors.executive.card,
  },
  assistantCard: {
    marginBottom: 10,
    backgroundColor: theme.colors.executive.card,
  },
  assistantTitle: {
    ...theme.typeScale.body,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.bold,
    marginBottom: 4,
  },
  assistantHint: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    lineHeight: 18,
    marginBottom: 10,
  },
  assistantActions: {
    gap: 8,
  },
  primaryActionBtn: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalMutedBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  primaryActionText: {
    ...theme.typeScale.caption,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.bold,
  },
  secondaryActionBtn: {
    minHeight: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  secondaryActionText: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  routeHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  routeTitle: {
    flex: 1,
    ...theme.typeScale.body,
    color: theme.colors.GraphiteBlue,
    fontFamily: FontFamily.semibold,
  },
  routeMeta: {
    marginTop: 6,
    ...theme.typeScale.caption,
    color: theme.colors.GraphiteBlue,
    fontFamily: FontFamily.semibold,
  },
});
