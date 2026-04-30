import { useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { StatusChip } from '../../components/ui/StatusChip';
import { useRegionState } from '../../state/region';
import { B2B2C_MERCHANTS, type Merchant } from '../../state/b2b2cDirectory';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

type HubFilter = 'Tất cả' | 'Nails' | 'Pháp lý' | 'Ăn uống';

const FILTERS: HubFilter[] = ['Tất cả', 'Nails', 'Pháp lý', 'Ăn uống'];

function matchesFilter(merchant: Merchant, filter: HubFilter): boolean {
  if (filter === 'Tất cả') return true;
  if (filter === 'Ăn uống') return merchant.category === 'Restaurant';
  if (filter === 'Pháp lý') return merchant.category === 'Legal';
  return merchant.category === 'Nails';
}

function formatRating(rating: number): string {
  return rating.toFixed(1);
}

function AnimatedPressableCard({
  children,
  onPress,
}: {
  children: ReactNode;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(scale.value, { duration: 150 }) }],
  }));
  return (
    <Animated.View style={cardStyle}>
      <Pressable
        onPress={onPress}
        onHoverIn={() => {
          scale.value = 0.98;
        }}
        onHoverOut={() => {
          scale.value = 1;
        }}
        onPressIn={() => {
          scale.value = 0.98;
        }}
        onPressOut={() => {
          scale.value = 1;
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

export function ServiceHubScreen() {
  const { currentCountry } = useRegionState();
  const [activeFilter, setActiveFilter] = useState<HubFilter>('Tất cả');

  const merchants = useMemo(
    () => B2B2C_MERCHANTS.filter((merchant) => matchesFilter(merchant, activeFilter)),
    [activeFilter]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Dịch vụ địa phương</Text>
          <Text style={styles.subtitle}>Tại {currentCountry}</Text>
          <Text style={styles.affiliateHint}>
            Giới thiệu đối tác — Miễn phí dịch vụ cho bạn · Được tài trợ bởi đối tác chính thức
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {FILTERS.map((filter) => {
            const active = filter === activeFilter;
            return (
              <AnimatedPressableCard key={filter} onPress={() => setActiveFilter(filter)}>
                <View style={[styles.filterChip, active && styles.filterChipActive]}>
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{filter}</Text>
                </View>
              </AnimatedPressableCard>
            );
          })}
        </ScrollView>

        <View style={styles.list}>
          {merchants.map((merchant) => (
            <AnimatedPressableCard key={merchant.id} onPress={() => Alert.alert('Thông báo', 'Đã gửi yêu cầu đến chủ tiệm.')}>
              <PrecisePanel style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleWrap}>
                    <Text style={styles.merchantName}>{merchant.name}</Text>
                    <Text style={styles.metaLine}>
                      {merchant.category} · {formatRating(merchant.rating)}
                    </Text>
                  </View>
                  {merchant.isAiActive ? <StatusChip state="Cleared" /> : <StatusChip state="Pending" />}
                </View>

                {merchant.isAiActive ? <Text style={styles.trustText}>AI đặt lịch: tức thì</Text> : null}

                <Pressable
                  onPress={() => Alert.alert('Thông báo', 'Đã gửi yêu cầu đến chủ tiệm.')}
                  style={({ pressed }) => [styles.bookButton, pressed && { opacity: 0.86 }]}
                >
                  <Text style={styles.bookButtonText}>Đặt lịch ngay</Text>
                </Pressable>
              </PrecisePanel>
            </AnimatedPressableCard>
          ))}
        </View>
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
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.text.primary,
  },
  subtitle: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  affiliateHint: {
    marginTop: 4,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    color: theme.colors.SoftEmerald,
    lineHeight: 18,
  },
  filterRow: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.sm,
  },
  filterChip: {
    minHeight: theme.components.button.height.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.CeolWhite,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  filterChipActive: {
    borderColor: theme.colors.SignalBlue,
    backgroundColor: theme.colors.SoftMineralGrey,
  },
  filterChipText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.textOnLight,
  },
  filterChipTextActive: {
    color: theme.colors.SignalBlue,
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.CeolWhite,
    borderColor: theme.colors.glass.borderSoft,
    gap: theme.spacing.sm,
    borderRadius: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  cardTitleWrap: {
    flex: 1,
    gap: 2,
  },
  merchantName: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.textOnLight,
  },
  metaLine: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.textOnLightMuted,
  },
  trustText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.SoftEmerald,
  },
  bookButton: {
    minHeight: theme.components.button.height.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.RouteError,
    backgroundColor: theme.colors.RouteError,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  bookButtonText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.CeolWhite,
  },
});
