import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ZeroClickSuggestion } from '../components/ai/ZeroClickSuggestion';
import { QuantumShieldBadge } from '../components/security/QuantumShieldBadge';
import type { RootStackParamList } from '../navigation/routes';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function AssistantChatScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={28} color={theme.hybrid.signalStrong} />
          <Text style={styles.title}>Minh Khang Assistant</Text>
          <Text style={styles.subtitle}>
            Đây là điểm vào hội thoại trực tiếp. Bạn có thể chuyển ngay sang phiên dịch, gọi hỗ trợ,
            hoặc tiếp tục với luồng concierge hiện tại.
          </Text>
          <QuantumShieldBadge compact />
        </View>

        <ZeroClickSuggestion />

        <Pressable
          onPress={() => navigation.navigate('LiveInterpreter')}
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.86 }]}
        >
          <Ionicons name="mic-outline" size={20} color={theme.hybrid.signalStrong} />
          <Text style={styles.actionText}>Bắt đầu Phiên dịch trực tiếp</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.navigate('LeonaCall')}
          style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.86 }]}
        >
          <Ionicons name="call-outline" size={20} color={theme.hybrid.signalStrong} />
          <Text style={styles.actionText}>Gọi Leona hỗ trợ xác minh</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.SoftMineralGrey },
  content: { padding: theme.spacing.lg, gap: theme.spacing.md },
  headerCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.colors.CeolWhite,
    padding: theme.spacing.lg,
    shadowColor: theme.colors.background,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    gap: 8,
  },
  title: {
    ...theme.typeScale.h2,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.bold,
  },
  subtitle: {
    ...theme.typeScale.body,
    color: theme.hybrid.panelCoolTextMuted,
    fontFamily: FontFamily.regular,
  },
  actionCard: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.hybrid.panelCoolBorder,
    backgroundColor: theme.colors.CeolWhite,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionText: {
    ...theme.typeScale.body,
    color: theme.hybrid.panelCoolText,
    fontFamily: FontFamily.semibold,
  },
});
