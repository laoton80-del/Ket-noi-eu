import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CopilotStep, useCopilot, walkthroughable } from 'react-native-copilot';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ZeroClickSuggestion } from '../components/ai/ZeroClickSuggestion';
import { SOSHeaderButton } from '../components/emergency/SOSHeaderButton';
import { AdaptiveContainer } from '../components/layout/AdaptiveContainer';
import { useAuth } from '../context/AuthContext';
import { useDeviceLayout } from '../hooks/useDeviceLayout';
import type { RootStackParamList } from '../navigation/routes';
import { useWalletState } from '../state/wallet';
import { theme } from '../theme/theme';
import { FontFamily } from '../theme/typography';

type Nav = NativeStackNavigationProp<RootStackParamList>;
const WalkthroughView = walkthroughable(View);
const HAS_SEEN_HOME_TOUR_KEY = 'kng_home_tour_seen_v1';

type CommandCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { start } = useCopilot();
  const { user } = useAuth();
  const { isMobile, isTablet, isWeb, isLandscape } = useDeviceLayout();
  const wallet = useWalletState();
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      const hasSeenTour = await AsyncStorage.getItem(HAS_SEEN_HOME_TOUR_KEY);
      if (hasSeenTour || !mounted) return;
      setTimeout(() => {
        if (!mounted) return;
        void start(undefined, scrollRef.current);
      }, 420);
      await AsyncStorage.setItem(HAS_SEEN_HOME_TOUR_KEY, '1');
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [start]);

  const columns = useMemo(() => {
    if (isMobile) return 2;
    if ((isTablet || isWeb) && isLandscape) return 4;
    if (isTablet || isWeb) return 3;
    return 2;
  }, [isLandscape, isMobile, isTablet, isWeb]);

  const cardWidth = useMemo(() => {
    if (columns === 4) return '23.5%';
    if (columns === 3) return '31.8%';
    return '48%';
  }, [columns]);

  const cards = useMemo<CommandCard[]>(
    () => [
      {
        id: 'smart-calendar',
        title: 'Lịch thông minh',
        subtitle: 'Lịch thông minh cho B2B',
        icon: 'calendar-outline',
        onPress: () => navigation.navigate('SmartCalendar'),
      },
      {
        id: 'inbound-queue',
        title: 'Hàng chờ',
        subtitle: 'Yêu cầu vào từ B2B/B2C',
        icon: 'people-outline',
        onPress: () => navigation.navigate('InboundQueue'),
      },
      {
        id: 'community',
        title: 'Cộng Đồng',
        subtitle: 'Không gian cộng đồng 3D',
        icon: 'planet-outline',
        onPress: () => navigation.navigate('Tabs', { screen: 'CongDong' }),
      },
      {
        id: 'partner-deals',
        title: 'Ưu đãi đối tác',
        subtitle: 'Trung tâm ưu đãi liên kết',
        icon: 'pricetags-outline',
        onPress: () => navigation.navigate('PartnerDeals'),
      },
    ],
    [navigation]
  );

  return (
    <SafeAreaView style={styles.container}>
      <AdaptiveContainer contentStyle={styles.content}>
        <ScrollView
          ref={(node) => {
            scrollRef.current = node;
          }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.greeting}>{`Chào buổi sáng, ${user?.name || 'bạn'}!`}</Text>
              <Text style={styles.greetingHint}>Bảng điều phối trung tâm cho toàn bộ Super-App hôm nay.</Text>
            </View>
            <CopilotStep
              name="SOS Khẩn Cấp"
              order={3}
              text="SOS: Chạm và giữ 3 giây khi gặp trường hợp khẩn cấp. Rất an toàn."
            >
              <WalkthroughView>
                <SOSHeaderButton />
              </WalkthroughView>
            </CopilotStep>
          </View>

          <CopilotStep
            name="Ví Global"
            order={1}
            text="Ví Global: Quản lý dòng tiền và nhận kiều hối không tốn phí."
          >
            <WalkthroughView>
              <View style={styles.walletCard}>
                <View>
                  <Text style={styles.walletLabel}>Ví nhanh</Text>
                  <Text style={styles.walletValue}>{wallet.credits.toLocaleString('vi-VN')} tín dụng</Text>
                </View>
                <View style={styles.walletActions}>
                  <Pressable
                    style={({ pressed }) => [styles.walletBtnPrimary, pressed && { opacity: 0.86 }]}
                    onPress={() => navigation.navigate('GlobalWallet')}
                  >
                    <Text style={styles.walletBtnPrimaryText}>Nạp</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.walletBtnGhost, pressed && { opacity: 0.86 }]}
                    onPress={() => {
                      Alert.alert('Rút tiền', 'Luồng rút tiền sẽ được mở trong bản phát hành tiếp theo.');
                    }}
                  >
                    <Text style={styles.walletBtnGhostText}>Rút</Text>
                  </Pressable>
                </View>
              </View>
            </WalkthroughView>
          </CopilotStep>

          <CopilotStep
            name="Ưu Đãi Đối Tác"
            order={2}
            text="Ưu đãi Đối tác: Khám phá các deal sỉ cực hời dành riêng cho bạn."
          >
            <WalkthroughView>
              <View style={styles.grid}>
                {cards.map((card) => (
                  <Pressable
                    key={card.id}
                    onPress={card.onPress}
                    style={({ pressed }) => [styles.commandCard, { width: cardWidth }, pressed && { opacity: 0.9 }]}
                  >
                    <View style={styles.commandIcon}>
                      <Ionicons name={card.icon} size={20} color={theme.hybrid.signalStrong} />
                    </View>
                    <Text style={styles.commandTitle}>{card.title}</Text>
                    <Text style={styles.commandSubtitle}>{card.subtitle}</Text>
                  </Pressable>
                ))}
              </View>
            </WalkthroughView>
          </CopilotStep>

          <View style={styles.zeroClickWrap}>
            <ZeroClickSuggestion />
            <Text style={styles.zeroClickHint}>Bạn có lịch hẹn lúc 3h chiều nay.</Text>
          </View>
        </ScrollView>
      </AdaptiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bgPrimary,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  greeting: {
    ...theme.typeScale.h2,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  greetingHint: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  walletCard: {
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.card,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  walletLabel: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
  walletValue: {
    ...theme.typeScale.h2,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  walletActions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  walletBtnPrimary: {
    minWidth: 68,
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  walletBtnPrimaryText: {
    ...theme.typeScale.caption,
    color: theme.components.button.variant.primary.text,
    fontFamily: FontFamily.bold,
  },
  walletBtnGhost: {
    minWidth: 68,
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panelMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  walletBtnGhostText: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  commandCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.glass.surface,
    padding: theme.spacing.md,
    minHeight: 126,
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: theme.elevation.card.shadowOffset,
    shadowOpacity: theme.elevation.card.shadowOpacity,
    shadowRadius: theme.elevation.card.shadowRadius,
    elevation: theme.elevation.card.elevation,
    gap: theme.spacing.xs,
  },
  commandIcon: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalMutedBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  commandTitle: {
    ...theme.typeScale.body,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.bold,
  },
  commandSubtitle: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  zeroClickWrap: {
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  zeroClickHint: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
});
