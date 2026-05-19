import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdaptiveContainer } from '../../components/layout/AdaptiveContainer';
import { PrecisePanel } from '../../components/ui/PrecisePanel';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import type { RootStackParamList } from '../../navigation/routes';
import { isRestApiConfigured } from '../../services/apiClient';
import {
  cancelMerchantTourismBooking,
  completeMerchantTourismBooking,
  confirmMerchantTourismBooking,
  fetchMerchantTourismBookings,
  type TourismMerchantInboxBooking,
} from '../../services/tourismMerchantInboxApi';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { formatVigTokenNumber } from '../../utils/currency';
import { useTranslation } from '../../utils/i18n';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { webGlassStyle, webHoverStyle, webNeonGlowStyle } from '../../utils/webStyles';

import {
  buildTourismInboxDisplayLabels,
  filterTourismInboxBookings,
  type TourismInboxFilterChip,
} from './tourismMerchantInboxUi';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTER_CHIPS: readonly TourismInboxFilterChip[] = [
  'all',
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'legacy',
];

function formatDateRange(startIso: string, endIso: string, locale: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' });
  return `${fmt.format(start)} → ${fmt.format(end)}`;
}

export function TourismMerchantInboxScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { isLandscape, isTablet, isWeb } = useDeviceLayout();
  const useWideLayout = (isTablet || isWeb) && isLandscape;

  const [bookings, setBookings] = useState<readonly TourismMerchantInboxBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TourismInboxFilterChip>('all');
  const [actionBookingId, setActionBookingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isRestApiConfigured()) {
      setError(t('tourism.merchantInbox.errorLoad'));
      setBookings([]);
      setLoading(false);
      return;
    }
    setError(null);
    const r = await fetchMerchantTourismBookings();
    if (r.ok) {
      setBookings(r.data.bookings);
    } else {
      setError(r.error || t('tourism.merchantInbox.errorLoad'));
      setBookings([]);
    }
    setLoading(false);
  }, [t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => filterTourismInboxBookings(bookings, activeFilter),
    [bookings, activeFilter]
  );

  const runAction = useCallback(
    async (
      bookingId: string,
      kind: 'confirm' | 'cancel' | 'complete'
    ): Promise<void> => {
      setActionBookingId(bookingId);
      const call =
        kind === 'confirm'
          ? confirmMerchantTourismBooking
          : kind === 'cancel'
            ? cancelMerchantTourismBooking
            : completeMerchantTourismBooking;
      const r = await call(bookingId);
      setActionBookingId(null);
      if (r.ok) {
        await load();
        return;
      }
      Alert.alert(t('tourism.merchantInbox.actionFailedTitle'), r.error);
    },
    [load, t]
  );

  const confirmAction = useCallback(
    (booking: TourismMerchantInboxBooking) => {
      Alert.alert(
        t('tourism.merchantInbox.confirmTitle'),
        t('tourism.merchantInbox.confirmBody'),
        [
          { text: t('tourism.merchantInbox.cancelBtn'), style: 'cancel' },
          {
            text: t('tourism.merchantInbox.confirmBtn'),
            onPress: () => void runAction(booking.id, 'confirm'),
          },
        ]
      );
    },
    [runAction, t]
  );

  const rejectAction = useCallback(
    (booking: TourismMerchantInboxBooking) => {
      Alert.alert(
        t('tourism.merchantInbox.rejectTitle'),
        t('tourism.merchantInbox.rejectBody'),
        [
          { text: t('tourism.merchantInbox.cancelBtn'), style: 'cancel' },
          {
            text: t('tourism.merchantInbox.rejectBtn'),
            style: 'destructive',
            onPress: () => void runAction(booking.id, 'cancel'),
          },
        ]
      );
    },
    [runAction, t]
  );

  const completeAction = useCallback(
    (booking: TourismMerchantInboxBooking) => {
      Alert.alert(
        t('tourism.merchantInbox.completeTitle'),
        t('tourism.merchantInbox.completeBody'),
        [
          { text: t('tourism.merchantInbox.cancelBtn'), style: 'cancel' },
          {
            text: t('tourism.merchantInbox.completeBtn'),
            onPress: () => void runAction(booking.id, 'complete'),
          },
        ]
      );
    },
    [runAction, t]
  );

  return (
    <SafeAreaView style={styles.container} className={applyWebStyles('kn-glass kn-neon-b2b')}>
      <AdaptiveContainer contentStyle={styles.adaptiveContent}>
        <ScrollView
          contentContainerStyle={[styles.content, useWideLayout && styles.contentWide]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void onRefresh()}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        >
          <View style={styles.topRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel={t('tourism.merchantInbox.backA11y')}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
            </Pressable>
            <Text style={styles.title}>{t('tourism.merchantInbox.title')}</Text>
          </View>

          <PrecisePanel style={styles.banner}>
            <Text style={styles.bannerText}>{t('tourism.merchantInbox.safetyBanner')}</Text>
          </PrecisePanel>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {FILTER_CHIPS.map((chip) => {
              const active = chip === activeFilter;
              return (
                <Pressable
                  key={chip}
                  onPress={() => setActiveFilter(chip)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {t(`tourism.merchantInbox.filter.${chip}`)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={theme.colors.primary} />
            </View>
          ) : error ? (
            <PrecisePanel style={styles.emptyPanel}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable onPress={() => void load()} style={styles.retryBtn}>
                <Text style={styles.retryText}>{t('tourism.retry')}</Text>
              </Pressable>
            </PrecisePanel>
          ) : filtered.length === 0 ? (
            <PrecisePanel style={styles.emptyPanel}>
              <Ionicons name="calendar-outline" size={28} color={theme.colors.SoftMineralGrey} />
              <Text style={styles.emptyText}>{t('tourism.merchantInbox.empty')}</Text>
            </PrecisePanel>
          ) : (
            <View style={styles.list}>
              {filtered.map((booking) => {
                const labels = buildTourismInboxDisplayLabels(booking);
                const busy = actionBookingId === booking.id;
                const touristName =
                  booking.tourist.displayName?.trim() ||
                  t('tourism.merchantInbox.guestFallback');
                return (
                  <PrecisePanel
                    key={booking.id}
                    style={[styles.card, webGlassStyle, webNeonGlowStyle, webHoverStyle]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.serviceTitle} numberOfLines={2}>
                          {booking.service.title}
                        </Text>
                        <Text style={styles.metaLine} numberOfLines={1}>
                          {touristName} · {booking.guestCount}{' '}
                          {t('tourism.merchantInbox.guests')}
                        </Text>
                        <Text style={styles.metaLine} numberOfLines={2}>
                          {formatDateRange(booking.startDate, booking.endDate, i18n.language)}
                        </Text>
                        <Text style={styles.amountLine}>
                          {formatVigTokenNumber(booking.totalPaidVIG, i18n.language)}
                        </Text>
                      </View>
                      <View style={styles.badgeCol}>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{labels.displayState}</Text>
                        </View>
                        <View style={[styles.badge, styles.badgeMuted]}>
                          <Text style={styles.badgeTextMuted}>{labels.walletPhase}</Text>
                        </View>
                      </View>
                    </View>

                    {labels.showConfirmedNote ? (
                      <Text style={styles.noteLine}>{t('tourism.merchantInbox.confirmedNote')}</Text>
                    ) : null}
                    {labels.showProviderSettledNote ? (
                      <Text style={styles.noteLine}>
                        {t('tourism.merchantInbox.providerSettledNote')}
                      </Text>
                    ) : null}
                    {booking.cancelReason ? (
                      <Text style={styles.noteMuted}>
                        {t('tourism.merchantInbox.cancelReason', {
                          reason: booking.cancelReason,
                        })}
                      </Text>
                    ) : null}

                    <View style={styles.actions}>
                      {booking.actions.canConfirm ? (
                        <Pressable
                          disabled={busy}
                          onPress={() => confirmAction(booking)}
                          style={({ pressed }) => [
                            styles.confirmBtn,
                            pressed && { opacity: 0.85 },
                            busy && styles.btnDisabled,
                          ]}
                        >
                          <Text style={styles.confirmBtnText}>
                            {t('tourism.merchantInbox.confirmBtn')}
                          </Text>
                        </Pressable>
                      ) : null}
                      {booking.actions.canCancel ? (
                        <Pressable
                          disabled={busy}
                          onPress={() => rejectAction(booking)}
                          style={({ pressed }) => [
                            styles.secondaryBtn,
                            pressed && { opacity: 0.85 },
                            busy && styles.btnDisabled,
                          ]}
                        >
                          <Text style={styles.secondaryBtnText}>
                            {t('tourism.merchantInbox.rejectBtn')}
                          </Text>
                        </Pressable>
                      ) : null}
                      {booking.actions.canComplete ? (
                        <Pressable
                          disabled={busy}
                          onPress={() => completeAction(booking)}
                          style={({ pressed }) => [
                            styles.completeBtn,
                            pressed && { opacity: 0.85 },
                            busy && styles.btnDisabled,
                          ]}
                        >
                          <Text style={styles.completeBtnText}>
                            {t('tourism.merchantInbox.completeBtn')}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </PrecisePanel>
                );
              })}
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
    backgroundColor: theme.colors.background,
  },
  adaptiveContent: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.md,
  },
  contentWide: {
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  backBtn: {
    padding: 6,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.bold,
    fontSize: 22,
    color: theme.colors.text.primary,
  },
  banner: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceMuted,
    borderColor: theme.colors.glass.borderSoft,
  },
  bannerText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text.secondary,
  },
  chipRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.surface,
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.glass.goldGlow,
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  chipTextActive: {
    color: theme.colors.primaryBright,
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  serviceTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  metaLine: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: theme.colors.text.secondary,
  },
  amountLine: {
    fontFamily: FontFamily.bold,
    fontSize: 15,
    color: theme.colors.primaryBright,
    marginTop: 4,
  },
  badgeCol: {
    gap: 6,
    alignItems: 'flex-end',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.glass.goldGlow,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
  },
  badgeMuted: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.glass.borderSoft,
  },
  badgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: theme.colors.primaryBright,
  },
  badgeTextMuted: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: theme.colors.text.tertiary,
  },
  noteLine: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: theme.colors.SoftEmerald,
  },
  noteMuted: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.tertiary,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  confirmBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
  },
  confirmBtnText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: theme.colors.onAccent,
  },
  secondaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  secondaryBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: theme.colors.danger,
  },
  completeBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.SignalBlue,
  },
  completeBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: theme.colors.SignalBlue,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  emptyPanel: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: theme.colors.danger,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: theme.spacing.sm,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
    color: theme.colors.primaryBright,
  },
  centered: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
  },
});
