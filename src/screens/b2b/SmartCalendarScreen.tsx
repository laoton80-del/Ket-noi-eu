import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SOSHeaderButton } from '../../components/emergency/SOSHeaderButton';
import { AdaptiveContainer } from '../../components/layout/AdaptiveContainer';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { StatusChip, type StatusChipState } from '../../components/ui/StatusChip';
import { APP_BRAND } from '../../config/appBrand';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import { useB2BBookingStore, type Booking, type Service } from '../../state/b2bBooking';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';

const CALENDAR_START_HOUR = 8;
const CALENDAR_END_HOUR = 18;
const HOUR_BLOCK_HEIGHT = 72;
const ROW_LABEL_WIDTH = 58;
const BOOKING_HORIZONTAL_INSET = 10;

function minutesSinceStart(iso: string): number {
  const date = new Date(iso);
  return (date.getHours() - CALENDAR_START_HOUR) * 60 + date.getMinutes();
}

function durationMinutes(startIso: string, endIso: string): number {
  return Math.max(15, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000));
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function resolveServiceName(booking: Booking, services: Service[]): string {
  const span = durationMinutes(booking.startTime, booking.endTime);
  const exact = services.find((service) => service.durationMinutes === span);
  if (exact) return exact.name;
  const nearest = services.reduce<Service | null>((acc, service) => {
    if (!acc) return service;
    return Math.abs(service.durationMinutes - span) < Math.abs(acc.durationMinutes - span) ? service : acc;
  }, null);
  return nearest?.name ?? 'Dịch vụ tổng quát';
}

function bookingChipState(status: Booking['status']): StatusChipState {
  if (status === 'inquiry') return 'Pending';
  if (status === 'no_show') return 'Error';
  return 'Cleared';
}

function AiListeningPulse() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400 }), -1, true);
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 0.95]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 1.22]) }],
  }));

  return (
    <Animated.View style={StyleSheet.flatten([styles.aiPulseDot, pulseStyle])} />
  );
}

type CalendarEventBlockProps = {
  booking: Booking;
  serviceName: string;
  top: number;
  height: number;
  isInquiry: boolean;
};

function CalendarEventBlock({ booking, serviceName, top, height, isInquiry }: CalendarEventBlockProps) {
  const hoverProgress = useSharedValue(0);
  const glowColor = isInquiry ? '#FFB000' : '#00FF66';
  const pressableStyle = isInquiry ? styles.bookingBlockInquiry : styles.bookingBlockConfirmed;

  const animatedBlockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(interpolate(hoverProgress.value, [0, 1], [1, 1.02]), { duration: 180 }) }],
    shadowOpacity: withTiming(interpolate(hoverProgress.value, [0, 1], [0.35, 0.72]), { duration: 180 }),
    shadowRadius: withTiming(interpolate(hoverProgress.value, [0, 1], [6, 12]), { duration: 180 }),
  }));

  return (
    <Animated.View
      style={StyleSheet.flatten([
        styles.bookingBlock,
        pressableStyle,
        {
          top,
          height,
          shadowColor: glowColor,
        },
        animatedBlockStyle,
      ])}
    >
      <Pressable
        onHoverIn={() => {
          hoverProgress.value = 1;
        }}
        onHoverOut={() => {
          hoverProgress.value = 0;
        }}
        onPressIn={() => {
          hoverProgress.value = 1;
        }}
        onPressOut={() => {
          hoverProgress.value = 0;
        }}
        style={styles.bookingPressable}
      >
        <View style={styles.bookingTopRow}>
          <Text style={styles.bookingName} numberOfLines={1}>{booking.customerName}</Text>
          <StatusChip state={bookingChipState(booking.status)} />
        </View>
        <Text style={styles.bookingMeta} numberOfLines={1}>
          {formatTime(booking.startTime)} - {formatTime(booking.endTime)} · {serviceName}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

export function SmartCalendarScreen() {
  const bookings = useB2BBookingStore((state) => state.bookings);
  const services = useB2BBookingStore((state) => state.services);
  const { isLandscape, isTablet, isWeb } = useDeviceLayout();
  const showSplitView = (isTablet || isWeb) && isLandscape;
  const queueBookings = bookings.filter((booking) => booking.status === 'inquiry' || booking.status === 'confirmed');
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredQueueId, setHoveredQueueId] = useState<string | null>(null);
  const hours = Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 }, (_, idx) => CALENDAR_START_HOUR + idx);
  const totalHeight = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_BLOCK_HEIGHT;
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1500);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        pointerEvents="none"
        colors={[theme.colors.DeepInkNavy, theme.colors.executive.panel, theme.colors.DeepInkNavy]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.topBar}>
          <View style={styles.brandWrap}>
            <Ionicons name="earth-outline" size={20} color={theme.colors.SignatureGold} />
            <Text style={styles.brandText}>{APP_BRAND.name}</Text>
          </View>
          <SOSHeaderButton tone="danger" />
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Lịch doanh nghiệp</Text>
          <View style={styles.statusRow}>
            <AiListeningPulse />
            <Text style={styles.statusLabel}>Lễ tân AI: Đang hoạt động</Text>
          </View>
        </View>

        <AdaptiveContainer contentStyle={[styles.mainLayout, showSplitView ? styles.mainLayoutSplit : styles.mainLayoutStack]}>
          <PrecisePanel style={[styles.queuePanel, showSplitView && styles.queuePanelSplit]}>
            <View style={styles.queueHeader}>
              <Text style={styles.queueTitle}>Hàng chờ vào</Text>
              <Text style={styles.queueCountPill}>{queueBookings.length}</Text>
            </View>
            {queueBookings.length === 0 ? (
              <Text style={styles.queueEmptyText}>Hiện không có yêu cầu chờ duyệt.</Text>
            ) : (
              <View style={styles.queueList}>
                {queueBookings.map((booking) => {
                  const serviceName = resolveServiceName(booking, services);
                  const isPending = booking.status === 'inquiry';
                  const statusLabel = isPending ? 'Đang chờ' : 'Đã xác nhận';
                  return (
                  <Pressable
                    key={booking.id}
                    onHoverIn={() => setHoveredQueueId(booking.id)}
                    onHoverOut={() => setHoveredQueueId((prev) => (prev === booking.id ? null : prev))}
                    style={({ pressed }) => [
                      styles.queueItem,
                      hoveredQueueId === booking.id && styles.queueItemHover,
                      pressed && { opacity: 0.92 },
                    ]}
                  >
                    <View style={styles.queueItemTopRow}>
                      <Text style={styles.queueItemName} numberOfLines={1}>{booking.customerName}</Text>
                      <View style={styles.queueStatusWrap}>
                        <View
                          style={[
                            styles.queueStatusDot,
                            isPending ? styles.queueStatusPendingDot : styles.queueStatusConfirmedDot,
                          ]}
                        />
                        <Text style={[styles.queueStatusText, isPending ? styles.queueStatusPendingText : styles.queueStatusConfirmedText]}>
                          {statusLabel}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.queueItemMeta}>{formatTime(booking.startTime)} - {formatTime(booking.endTime)}</Text>
                    <View style={styles.serviceTagWrap}>
                      <View style={[styles.serviceTag, isPending ? styles.serviceTagPending : styles.serviceTagConfirmed]}>
                        <Text style={styles.serviceTagText} numberOfLines={1}>{serviceName}</Text>
                      </View>
                    </View>
                  </Pressable>
                  );
                })}
              </View>
            )}
            <Pressable style={({ pressed }) => [styles.addGuestBtn, pressed && { opacity: 0.88 }]}>
              <LinearGradient
                colors={['#4F46E5', '#3B82F6']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.addGuestGradient}
              >
                <Ionicons name="add" size={16} color={theme.colors.CeolWhite} />
                <Text style={styles.addGuestText}>Thêm khách</Text>
              </LinearGradient>
            </Pressable>
          </PrecisePanel>

          <PrecisePanel style={styles.timelineShell}>
            <View style={styles.timelineBody}>
              <View style={styles.timeColumn}>
                {hours.map((hour) => (
                  <Text key={`hour_${hour}`} style={styles.timeLabel}>
                    {String(hour).padStart(2, '0')}:00
                  </Text>
                ))}
              </View>

              <View style={styles.slotTrack}>
                {hours.map((hour, idx) => {
                  if (idx === hours.length - 1) return null;
                  return <View key={`line_${hour}`} style={styles.hourLine} />;
                })}

                {bookings.map((booking) => {
                  const top = (minutesSinceStart(booking.startTime) / 60) * HOUR_BLOCK_HEIGHT;
                  const height = (durationMinutes(booking.startTime, booking.endTime) / 60) * HOUR_BLOCK_HEIGHT;
                  const serviceName = resolveServiceName(booking, services);
                  const isInquiry = booking.status === 'inquiry';
                  return (
                    <CalendarEventBlock
                      key={booking.id}
                      booking={booking}
                      serviceName={serviceName}
                      top={top}
                      height={height}
                      isInquiry={isInquiry}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.trackOverlay} pointerEvents="none">
              <View style={[styles.trackOverlayInner, { height: totalHeight }]} />
            </View>
            <Pressable style={({ pressed }) => [styles.fab, pressed && { opacity: 0.8 }]}>
              <Ionicons name="add" size={18} color={theme.components.button.variant.primary.text} />
              <Text style={styles.fabText}>Thêm lịch thủ công</Text>
            </Pressable>
          </PrecisePanel>
        </AdaptiveContainer>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#12141C',
  },
  content: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  topBar: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minWidth: 0,
  },
  brandLogo: {
    width: 28,
    height: 28,
  },
  brandText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.CeolWhite,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    ...theme.typeScale.h2,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.CeolWhite,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  aiPulseDot: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.SoftEmerald,
    shadowColor: theme.colors.SoftEmerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 6,
    elevation: 2,
  },
  statusLabel: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.SoftEmerald,
  },
  mainLayout: {
    gap: theme.spacing.md,
  },
  mainLayoutSplit: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  mainLayoutStack: {
    flexDirection: 'column',
  },
  queuePanel: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.05)',
    gap: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  queuePanelSplit: {
    width: '30%',
    minWidth: 320,
    maxWidth: 420,
  },
  queueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  queueCountPill: {
    minWidth: 26,
    height: 26,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.xs,
    textAlign: 'center',
    textAlignVertical: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: theme.colors.CeolWhite,
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
  },
  queueTitle: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.text.primary,
  },
  queueList: {
    gap: theme.spacing.sm,
  },
  queueItem: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(17, 20, 31, 0.92)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  queueItemHover: {
    borderColor: 'rgba(114, 137, 218, 0.5)',
    transform: [{ translateY: -1 }],
  },
  queueItemTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  queueItemName: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: theme.colors.text.primary,
  },
  queueItemMeta: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  queueStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  queueStatusDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.pill,
  },
  queueStatusConfirmedDot: {
    backgroundColor: '#00FF66',
    shadowColor: '#00FF66',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  queueStatusPendingDot: {
    backgroundColor: '#FFB000',
    shadowColor: '#FFB000',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  queueStatusText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
  },
  queueStatusConfirmedText: {
    color: '#00FF66',
  },
  queueStatusPendingText: {
    color: '#FFB000',
  },
  serviceTagWrap: {
    marginTop: theme.spacing.xs,
  },
  serviceTag: {
    alignSelf: 'flex-start',
    minHeight: 24,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  serviceTagConfirmed: {
    borderColor: 'rgba(0,255,102,0.65)',
    backgroundColor: 'rgba(0,255,102,0.1)',
  },
  serviceTagPending: {
    borderColor: 'rgba(255,176,0,0.65)',
    backgroundColor: 'rgba(255,176,0,0.1)',
  },
  serviceTagText: {
    ...theme.typeScale.caption,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.medium,
  },
  queueEmptyText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  timelineShell: {
    flex: 1,
    width: '70%',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
    padding: 0,
    minHeight: (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_BLOCK_HEIGHT + 76,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  timelineBody: {
    flexDirection: 'row',
    minHeight: (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_BLOCK_HEIGHT,
  },
  timeColumn: {
    width: ROW_LABEL_WIDTH,
    paddingTop: theme.spacing.sm,
    paddingLeft: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  timeLabel: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: '#888888',
    minHeight: HOUR_BLOCK_HEIGHT,
  },
  slotTrack: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: theme.colors.glass.borderSoft,
    position: 'relative',
  },
  hourLine: {
    height: HOUR_BLOCK_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  bookingBlock: {
    position: 'absolute',
    left: BOOKING_HORIZONTAL_INSET,
    right: BOOKING_HORIZONTAL_INSET,
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 1,
    borderRadius: theme.radius.md,
  },
  bookingPressable: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  bookingBlockConfirmed: {
    borderColor: '#00FF66',
    backgroundColor: 'transparent',
    shadowColor: '#00FF66',
  },
  bookingBlockInquiry: {
    borderColor: '#FFB000',
    backgroundColor: 'transparent',
    shadowColor: '#FFB000',
  },
  bookingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
    flexWrap: 'nowrap',
  },
  bookingName: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.CeolWhite,
    flex: 1,
  },
  bookingMeta: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.84)',
  },
  trackOverlay: {
    position: 'absolute',
    left: ROW_LABEL_WIDTH,
    right: 0,
    top: 0,
    bottom: 0,
  },
  trackOverlayInner: {
    borderLeftWidth: 0,
  },
  fab: {
    position: 'absolute',
    right: theme.spacing.md,
    bottom: theme.spacing.md,
    minHeight: theme.components.button.height.md,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(79,70,229,0.88)',
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  fabText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.semibold,
    color: theme.colors.CeolWhite,
  },
  addGuestBtn: {
    marginTop: theme.spacing.sm,
    borderRadius: theme.radius.pill,
    overflow: 'hidden',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.58,
    shadowRadius: 10,
    elevation: 6,
  },
  addGuestGradient: {
    minHeight: 42,
    borderRadius: theme.radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.lg,
  },
  addGuestText: {
    ...theme.typeScale.body,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.bold,
  },
});
