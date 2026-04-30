import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdaptiveContainer } from '../../components/layout/AdaptiveContainer';
import { Skeleton } from '../../components/ui/Skeleton';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { StatusChip } from '../../components/ui/StatusChip';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import { useB2BBookingStore } from '../../state/b2bBooking';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { webGlassStyle, webHoverStyle, webNeonGlowStyle } from '../../utils/webStyles';

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function InboundQueueScreen() {
  const { isLandscape, isTablet, isWeb } = useDeviceLayout();
  const bookings = useB2BBookingStore((state) => state.bookings);
  const confirmBooking = useB2BBookingStore((state) => state.confirmBooking);
  const inquiries = bookings.filter((booking) => booking.status === 'inquiry');
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const useWideLayout = (isTablet || isWeb) && isLandscape;

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1500);
  }, []);

  return (
    <SafeAreaView style={styles.container} className={applyWebStyles('kn-glass kn-neon-b2b')}>
      <AdaptiveContainer contentStyle={styles.adaptiveContent}>
        <ScrollView
          contentContainerStyle={[styles.content, useWideLayout && styles.contentWide]}
          showsVerticalScrollIndicator={false}
          className={applyWebStyles('kn-glass')}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.title}>Hàng chờ yêu cầu vào</Text>
            <View style={styles.headerStatusRow}>
              <StatusChip state="Pending" />
              <Text style={styles.pendingCount}>{inquiries.length} chờ duyệt</Text>
            </View>
          </View>
          {initialLoading ? (
            <View style={styles.list}>
              {Array.from({ length: 3 }, (_, idx) => (
                <PrecisePanel key={`skeleton_${idx}`} style={styles.card}>
                  <View style={styles.skeletonHeaderRow}>
                    <Skeleton width="48%" height={16} />
                    <Skeleton width={74} height={24} borderRadius={theme.radius.pill} />
                  </View>
                  <Skeleton width="82%" height={14} />
                  <Skeleton width="100%" height={44} borderRadius={theme.radius.md} />
                </PrecisePanel>
              ))}
            </View>
          ) : inquiries.length === 0 ? (
            <PrecisePanel style={styles.emptyPanel}>
              <Ionicons name="checkmark-circle-outline" size={28} color={theme.colors.SoftMineralGrey} />
              <Text style={styles.emptyText}>Không có yêu cầu chờ duyệt mới. AI Lễ tân đang trực.</Text>
            </PrecisePanel>
          ) : (
            <View style={styles.list}>
              {inquiries.map((booking) => (
                <Animated.View key={booking.id} entering={FadeIn} exiting={FadeOut} layout={Layout.springify()}>
                  <PrecisePanel style={[styles.card, webGlassStyle, webNeonGlowStyle, webHoverStyle]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.customerName}>{booking.customerName}</Text>
                        <Text style={styles.requestedTime}>
                          {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                        </Text>
                      </View>
                      <StatusChip state="Pending" />
                    </View>

                    <Text style={styles.summaryText}>
                      {booking.handoffSummary ?? 'AI Lễ tân chưa gửi tóm tắt cho yêu cầu này.'}
                    </Text>

                    <View style={styles.footerActions}>
                      <Pressable
                        onPress={() => {
                          confirmBooking(booking.id);
                          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }}
                        style={({ pressed }) => [styles.confirmBtn, pressed && { opacity: 0.8 }]}
                      >
                        <Text style={styles.confirmBtnText}>Xác nhận</Text>
                      </Pressable>
                      <Pressable style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.8 }]}>
                        <Text style={styles.secondaryBtnText}>Từ chối / Gọi lại</Text>
                      </Pressable>
                    </View>
                  </PrecisePanel>
                </Animated.View>
              ))}
            </View>
          )}
        </ScrollView>
      </AdaptiveContainer>
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
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  adaptiveContent: {
    flex: 1,
  },
  contentWide: {
    maxWidth: 980,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.CeolWhite,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  pendingCount: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.PendingAmber,
  },
  list: {
    gap: theme.spacing.md,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  card: {
    backgroundColor: theme.colors.SoftMineralGrey,
    borderColor: theme.colors.PendingAmber,
    gap: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  cardHeaderText: {
    flex: 1,
    gap: 2,
  },
  customerName: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.hybrid.panelCoolText,
  },
  requestedTime: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.medium,
    color: theme.hybrid.panelCoolTextMuted,
  },
  summaryText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.hybrid.panelCoolText,
    lineHeight: theme.typeScale.body.lineHeight,
  },
  footerActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  confirmBtn: {
    flex: 1,
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.components.button.variant.primary.border,
    backgroundColor: theme.components.button.variant.primary.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    color: theme.components.button.variant.primary.text,
  },
  secondaryBtn: {
    flex: 1,
    minHeight: theme.components.button.height.sm,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.components.button.variant.secondary.border,
    backgroundColor: theme.components.button.variant.secondary.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.components.button.variant.secondary.text,
  },
  emptyPanel: {
    backgroundColor: theme.colors.executive.panelMuted,
    borderColor: theme.colors.glass.borderSoft,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    minHeight: 180,
  },
  emptyText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.regular,
    color: theme.colors.SoftMineralGrey,
    textAlign: 'center',
    lineHeight: theme.typeScale.body.lineHeight,
  },
});
