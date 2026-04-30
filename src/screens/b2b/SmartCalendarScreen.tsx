import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CallerLanguageBadge,
  getCallerLanguageFlagEmoji,
  getCallerLanguageLabelVi,
} from '../../components/b2b/CallerLanguageBadge';
import { VoiceAiReceptionistMerchantPanel } from '../../components/b2b/VoiceAiReceptionistMerchantPanel';
import { VoiceAiSecuredTag } from '../../components/b2b/VoiceAiSecuredTag';
import { ZeroTouchCommandDeck } from '../../components/b2b/ZeroTouchCommandDeck';
import { AdaptiveContainer } from '../../components/layout/AdaptiveContainer';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { StatusChip, type StatusChipState } from '../../components/ui/StatusChip';
import { APP_BRAND } from '../../config/appBrand';
import { PRICING_AUTHORITY, PRICING_BASELINE_CURRENCY } from '../../config/pricingConfig';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import { stripeConnectService } from '../../services/fintech/StripeConnectService';
import { subscribeVoiceReceptionistAiEvents } from '../../services/ai/VoiceReceptionistService';
import { useB2BBookingStore, type Booking, type Service } from '../../state/b2bBooking';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles, mergeWebClassNames } from '../../utils/applyWebStyles';
import { formatCurrency } from '../../utils/currencyFormatter';
import { webGlassStyle, webHoverStyle } from '../../utils/webStyles';

const CALENDAR_START_HOUR = 8;
const CALENDAR_END_HOUR = 18;
const HOUR_BLOCK_HEIGHT = 72;
const ROW_LABEL_WIDTH = 58;
const BOOKING_HORIZONTAL_INSET = 6;

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
  const HOVER_ANIM_MS = 180;

  const animatedBlockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(interpolate(hoverProgress.value, [0, 1], [1, 1.02]), { duration: HOVER_ANIM_MS }) }],
    shadowOpacity: withTiming(interpolate(hoverProgress.value, [0, 1], [0.22, 0.68]), { duration: HOVER_ANIM_MS }),
    shadowRadius: withTiming(interpolate(hoverProgress.value, [0, 1], [5, 14]), { duration: HOVER_ANIM_MS }),
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
        {booking.aiSummaryVi ? (
          <Text style={styles.bookingAiHeadline} numberOfLines={2}>
            {booking.aiSummaryVi}
          </Text>
        ) : null}
        <Text style={styles.bookingMeta} numberOfLines={1}>
          {formatTime(booking.startTime)} - {formatTime(booking.endTime)} · {serviceName}
        </Text>
        {booking.voiceAiMeta?.securedByAi ? (
          <View style={styles.bookingAiRow}>
            <CallerLanguageBadge language={booking.voiceAiMeta.callerLanguage} />
            <VoiceAiSecuredTag />
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export function SmartCalendarScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const bookings = useB2BBookingStore((state) => state.bookings);
  const services = useB2BBookingStore((state) => state.services);
  const { isLandscape, isTablet, isWeb } = useDeviceLayout();
  const showSplitView = (isTablet || isWeb) && isLandscape;
  const queueBookings = bookings.filter((booking) => booking.status === 'inquiry' || booking.status === 'confirmed');
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredQueueId, setHoveredQueueId] = useState<string | null>(null);
  const [mockTier, setMockTier] = useState<'PRO' | 'POWER'>('POWER');
  const [aiVoiceToast, setAiVoiceToast] = useState<string | null>(null);
  const isBillingDesktop = width >= 980;
  const confirmedBookingsToday = queueBookings.filter((booking) => booking.status === 'confirmed').length;
  const voiceMerchantPackage = mockTier === 'POWER' ? 'Power' : 'Pro';
  const voiceUsedMinutesThisMonth = mockTier === 'POWER' ? 155 : 10;
  const todayRevenueMajor = 450;
  const kngPlatformFeeMajor = -Math.max(
    PRICING_AUTHORITY.overageAndPlatformFees.basePriorityFeeMajor,
    confirmedBookingsToday * PRICING_AUTHORITY.overageAndPlatformFees.basePriorityFeeMajor
  );
  const passiveIncomeMajor =
    confirmedBookingsToday *
    PRICING_AUTHORITY.tiers.Basic.displayPriceMajor *
    PRICING_AUTHORITY.passiveIncomeSplit.partner;
  const hours = Array.from({ length: CALENDAR_END_HOUR - CALENDAR_START_HOUR + 1 }, (_, idx) => CALENDAR_START_HOUR + idx);
  const totalHeight = (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_BLOCK_HEIGHT;
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 1500);
  }, []);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const unsub = subscribeVoiceReceptionistAiEvents((evt) => {
      setAiVoiceToast(evt.toastVi);
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setAiVoiceToast(null), 5200);
    });
    return () => {
      unsub();
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} className={applyWebStyles('kn-glass kn-neon-b2b')}>
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
        <View style={styles.topBar} className={applyWebStyles('kn-glass')}>
          <View style={styles.brandWrap} className={applyWebStyles('kn-neon-b2b')}>
            <Ionicons name="earth-outline" size={20} color={theme.colors.SignatureGold} />
            <Text style={styles.brandText}>{APP_BRAND.name}</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate('EmergencySOS' as never)}
            style={({ pressed }) => [styles.sosPillBtn, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel="SOS"
          >
            <Text style={styles.sosPillText}>SOS</Text>
          </Pressable>
        </View>

        <View style={styles.headerCompactRow}>
          <Text style={styles.title}>Lịch doanh nghiệp</Text>
          <View style={styles.statusRow}>
            <AiListeningPulse />
            <Text style={styles.statusLabel}>Lễ tân AI: Đang hoạt động</Text>
          </View>
        </View>

        {aiVoiceToast ? (
          <View style={styles.aiVoiceToast} className={applyWebStyles('kn-neon-b2b')}>
            <Text style={styles.aiVoiceToastText}>{aiVoiceToast}</Text>
          </View>
        ) : null}

        <View style={styles.financialSnapshotWrap} className={applyWebStyles('kn-glass kn-neon-b2b')}>
        <PrecisePanel style={styles.financialSnapshotPanel}>
          <View style={styles.financialSnapshotHeader}>
            <Text style={styles.financialSnapshotTitle}>Financial Snapshot</Text>
            <View style={styles.financialHeaderActions}>
              <Pressable
                onPress={() => setMockTier((prev) => (prev === 'POWER' ? 'PRO' : 'POWER'))}
                style={({ pressed }) => [styles.devTierToggleBtn, pressed && { opacity: 0.84 }]}
              >
                <Text style={styles.devTierToggleText}>DEV: {mockTier}</Text>
              </Pressable>
              <View style={styles.billingTierBadge}>
                <Text style={styles.billingTierBadgeText}>
                  {mockTier} TIER - Active
                </Text>
              </View>
            </View>
          </View>
          <View style={[styles.financialMetricsRow, isBillingDesktop ? styles.financialMetricsRowDesktop : styles.financialMetricsRowMobile]}>
            <View style={styles.financialMetricCard} className={applyWebStyles('kn-neon-b2b')}>
              <View style={styles.financialMetricTitleRow}>
                <Text style={styles.financialMetricIcon}>💰</Text>
                <Text style={styles.financialMetricLabel}>Doanh Thu Hôm Nay</Text>
              </View>
              <Text style={styles.financialMetricValue}>
                {formatCurrency(todayRevenueMajor, PRICING_BASELINE_CURRENCY)}
              </Text>
            </View>
            <View style={styles.financialMetricCard} className={applyWebStyles('kn-neon-sos')}>
              <View style={styles.financialMetricTitleRow}>
                <Text style={styles.financialMetricIcon}>⚡</Text>
                <Text style={styles.financialMetricLabel}>Phí Nền Tảng KNG</Text>
              </View>
              <Text style={styles.financialMetricValueDanger}>
                {formatCurrency(kngPlatformFeeMajor, PRICING_BASELINE_CURRENCY)}
              </Text>
            </View>
            <View style={styles.financialMetricCard} className={applyWebStyles('kn-neon-b2b')}>
              <View style={styles.financialMetricTitleRow}>
                <Text style={styles.financialMetricIcon}>🌟</Text>
                <Text style={styles.financialMetricLabel}>Thu Nhập Thụ Động</Text>
              </View>
              <Text style={styles.financialMetricValue}>
                {formatCurrency(passiveIncomeMajor, PRICING_BASELINE_CURRENCY)}
              </Text>
            </View>
          </View>
          <Text style={styles.financialHintLine}>
            Đã áp phí theo lượt xác nhận hôm nay: {confirmedBookingsToday} lượt x{' '}
            {formatCurrency(PRICING_AUTHORITY.overageAndPlatformFees.basePriorityFeeMajor, PRICING_BASELINE_CURRENCY)}.
          </Text>
          {mockTier === 'PRO' ? (
            <Pressable style={({ pressed }) => [styles.powerUpsellBtn, pressed && { opacity: 0.86 }]}>
              <Text style={styles.powerUpsellText}>Nâng cấp POWER - Không giới hạn đơn</Text>
            </Pressable>
          ) : (
            <Text style={styles.powerActiveLine}>POWER TIER - Active</Text>
          )}
        </PrecisePanel>
        </View>

        <View
          style={[styles.stripeConnectPanel, isBillingDesktop && styles.stripeConnectPanelWide]}
          className={applyWebStyles('kn-glass')}
        >
          <Text style={styles.stripeConnectTitle}>CỔNG THANH TOÁN QUỐC TẾ (Stripe Connect)</Text>
          <Text style={styles.stripeConnectKyc}>
            Vui lòng xác minh danh tính (KYC) để nhận tiền thanh toán trực tiếp từ khách hàng.
          </Text>
          <View style={styles.stripeConnectRateWrap} className={mergeWebClassNames('kn-neon-b2b')}>
            <Text style={styles.stripeConnectRate}>
              Phí giao dịch: {PRICING_AUTHORITY.overageAndPlatformFees.b2bTransactionFeePercent}% +{' '}
              {formatCurrency(PRICING_AUTHORITY.overageAndPlatformFees.b2bTransactionFixedFeeMajor, PRICING_BASELINE_CURRENCY)}
            </Text>
          </View>
          <Text style={styles.stripeConnectSub}>
            Minh bạch tuyệt đối - Không phụ phí ẩn. Tiền về thẳng tài khoản ngân hàng của tiệm!
          </Text>
          <View style={isBillingDesktop ? styles.stripeConnectActionsRow : styles.stripeConnectActionsCol}>
            <Pressable
              onPress={() => {
                const r = stripeConnectService.onboardB2BMerchant('b2b-merchant-smart-calendar');
                Alert.alert('Stripe Connect (mock)', `${r.messageVi}\n\n${r.stripeOnboardingUrl}`);
              }}
              style={({ pressed }) => [styles.stripeConnectBtn, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.primaryBright} />
              <Text style={styles.stripeConnectBtnText}>Bắt đầu KYC (mock)</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                const r = stripeConnectService.processMarketplaceTransaction('b2c-demo', 'b2b-merchant-smart-calendar', 100);
                if (r.ok) {
                  Alert.alert('Marketplace (mock)', r.messageVi);
                } else {
                  Alert.alert('Lỗi', r.messageVi);
                }
              }}
              style={({ pressed }) => [styles.stripeConnectBtnSecondary, pressed && { opacity: 0.88 }]}
            >
              <Ionicons name="swap-horizontal-outline" size={18} color={theme.hybrid.onSignal} />
              <Text style={styles.stripeConnectBtnSecondaryText}>
                Demo giao dịch {formatCurrency(100, PRICING_BASELINE_CURRENCY)}
              </Text>
            </Pressable>
          </View>
        </View>

        <VoiceAiReceptionistMerchantPanel
          merchantPackage={voiceMerchantPackage}
          usedVoiceAiMinutesThisMonth={voiceUsedMinutesThisMonth}
        />

        <ZeroTouchCommandDeck variant="dark" />

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
                  const callerLang = booking.voiceAiMeta?.callerLanguage;
                  const commandHeadline =
                    booking.aiSummaryVi && callerLang
                      ? `${booking.aiSummaryVi} — Khách: ${booking.customerName} (${getCallerLanguageFlagEmoji(callerLang)} ${getCallerLanguageLabelVi(callerLang)})`
                      : booking.aiSummaryVi
                        ? `${booking.aiSummaryVi} — Khách: ${booking.customerName}`
                        : null;
                  return (
                  <Pressable
                    key={booking.id}
                    onHoverIn={() => setHoveredQueueId(booking.id)}
                    onHoverOut={() => setHoveredQueueId((prev) => (prev === booking.id ? null : prev))}
                    style={({ pressed }) => [
                      styles.queueItem,
                      webGlassStyle,
                      isPending ? styles.queueItemPendingGlow : styles.queueItemConfirmedGlow,
                      webHoverStyle,
                      hoveredQueueId === booking.id && styles.queueItemHover,
                      pressed && { opacity: 0.92 },
                    ]}
                  >
                    {commandHeadline ? (
                      <Text style={styles.queueCommandHeadline} numberOfLines={3}>
                        {commandHeadline}
                      </Text>
                    ) : null}
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
                    {booking.voiceAiMeta?.securedByAi ? (
                      <View style={styles.queueAiRow}>
                        <CallerLanguageBadge language={booking.voiceAiMeta.callerLanguage} />
                        <VoiceAiSecuredTag />
                      </View>
                    ) : null}
                    <View style={styles.serviceTagWrap}>
                      <View style={[styles.serviceTag, isPending ? styles.serviceTagPending : styles.serviceTagConfirmed]}>
                        <Text style={styles.serviceTagText} numberOfLines={1}>{serviceName}</Text>
                      </View>
                    </View>
                    <View style={styles.queueActionsRow}>
                      <Pressable style={({ pressed }) => [styles.queueConfirmBtn, pressed && { opacity: 0.86 }]}>
                        <Text style={styles.queueConfirmText}>Xác nhận</Text>
                      </Pressable>
                      <Pressable style={({ pressed }) => [styles.queueCancelBtn, pressed && { opacity: 0.86 }]}>
                        <Text style={styles.queueCancelText}>Hủy</Text>
                      </Pressable>
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

          <PrecisePanel style={[styles.timelineShell, showSplitView && styles.timelineShellSplit, webGlassStyle, webHoverStyle]}>
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
  brandText: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.CeolWhite,
  },
  sosPillBtn: {
    minHeight: 34,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7E121A',
    shadowColor: '#FF3333',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  sosPillText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    letterSpacing: 0.5,
  },
  headerCompactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typeScale.h2,
    fontSize: 20,
    lineHeight: 26,
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
  aiVoiceToast: {
    marginBottom: theme.spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.55)',
    backgroundColor: 'rgba(0, 255, 102, 0.1)',
  },
  aiVoiceToastText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    color: theme.colors.CeolWhite,
    lineHeight: 18,
  },
  financialSnapshotPanel: {
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: theme.spacing.sm,
  },
  financialSnapshotWrap: {
    marginBottom: theme.spacing.xs,
    borderRadius: theme.radius.lg,
  },
  stripeConnectPanel: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: 'rgba(17, 20, 31, 0.88)',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  stripeConnectPanelWide: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  stripeConnectTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.CeolWhite,
    letterSpacing: 0.3,
  },
  stripeConnectKyc: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  stripeConnectRateWrap: {
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
  },
  stripeConnectRate: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
  },
  stripeConnectSub: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.medium,
    color: theme.colors.text.secondary,
  },
  stripeConnectActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  stripeConnectActionsCol: {
    flexDirection: 'column',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  stripeConnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
    minWidth: 160,
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(197, 160, 89, 0.16)',
  },
  stripeConnectBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: theme.colors.primaryBright,
  },
  stripeConnectBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
    minWidth: 160,
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.hybrid.signalSubtleBorder,
    backgroundColor: theme.hybrid.signalMutedBg,
  },
  stripeConnectBtnSecondaryText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: theme.hybrid.onSignal,
  },
  financialSnapshotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  financialHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  financialSnapshotTitle: {
    ...theme.typeScale.body,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.extrabold,
  },
  billingTierBadge: {
    minHeight: 28,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: 'rgba(197, 160, 89, 0.18)',
    shadowColor: theme.colors.SignatureGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 8,
    elevation: 4,
  },
  devTierToggleBtn: {
    minHeight: 26,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(17,20,31,0.95)',
  },
  devTierToggleText: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.semibold,
  },
  billingTierBadgeText: {
    ...theme.typeScale.caption,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.bold,
  },
  financialMetricsRow: {
    gap: theme.spacing.sm,
  },
  financialMetricsRowDesktop: {
    flexDirection: 'row',
  },
  financialMetricsRowMobile: {
    flexDirection: 'column',
  },
  financialMetricCard: {
    flex: 1,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(17, 20, 31, 0.92)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
    gap: 4,
  },
  financialMetricTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  financialMetricIcon: {
    fontSize: 12,
    lineHeight: 16,
  },
  financialMetricLabel: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
  },
  financialMetricValue: {
    ...theme.typeScale.h2,
    color: '#00FF66',
    fontFamily: FontFamily.extrabold,
  },
  financialMetricValueDanger: {
    ...theme.typeScale.h2,
    color: '#FF6B6B',
    fontFamily: FontFamily.extrabold,
  },
  financialHintLine: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
    lineHeight: theme.typeScale.caption.lineHeight * 1.2,
  },
  powerUpsellBtn: {
    marginTop: 2,
    minHeight: 38,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.hybrid.signatureLine,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerUpsellText: {
    ...theme.typeScale.caption,
    color: theme.colors.CeolWhite,
    fontFamily: FontFamily.bold,
  },
  powerActiveLine: {
    ...theme.typeScale.caption,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.bold,
    textAlign: 'right',
  },
  mainLayout: {
    gap: theme.spacing.md,
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    flex: 1,
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
  queueItemConfirmedGlow: {
    shadowColor: '#00FF66',
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  queueItemPendingGlow: {
    shadowColor: '#FFB000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
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
  queueCommandHeadline: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: theme.colors.CeolWhite,
    lineHeight: 19,
    marginBottom: 8,
    letterSpacing: 0.2,
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
  queueAiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
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
  queueActionsRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  queueConfirmBtn: {
    flex: 1,
    minHeight: 30,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,255,102,0.5)',
    backgroundColor: 'rgba(0,255,102,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueConfirmText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.semibold,
    color: '#00FF66',
  },
  queueCancelBtn: {
    flex: 1,
    minHeight: 30,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(229,57,53,0.88)',
    backgroundColor: '#E53935',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueCancelText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.bold,
    color: '#FFFFFF',
  },
  queueEmptyText: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: theme.colors.text.secondary,
  },
  timelineShell: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 0,
    minHeight: (CALENDAR_END_HOUR - CALENDAR_START_HOUR) * HOUR_BLOCK_HEIGHT + 76,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  timelineShellSplit: {
    width: undefined,
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
    shadowOpacity: 0.22,
    shadowRadius: 5,
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
    flexWrap: 'wrap',
  },
  bookingName: {
    ...theme.typeScale.body,
    fontFamily: FontFamily.bold,
    color: theme.colors.CeolWhite,
    flex: 1,
  },
  bookingAiHeadline: {
    ...theme.typeScale.caption,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: FontFamily.bold,
    color: 'rgba(255, 230, 190, 0.95)',
    marginBottom: 2,
  },
  bookingMeta: {
    ...theme.typeScale.caption,
    fontFamily: FontFamily.regular,
    color: 'rgba(255,255,255,0.84)',
  },
  bookingAiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
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
