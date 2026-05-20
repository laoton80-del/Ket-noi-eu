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
  cancelUserLocalServiceRequest,
  fetchUserLocalRequestTimeline,
  fetchUserLocalServiceRequests,
  type LocalUserRequestListItem,
  type LocalUserRequestTimelineItem,
} from '../../services/localUserRequestApi';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../utils/i18n';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { webGlassStyle, webHoverStyle, webNeonGlowStyle } from '../../utils/webStyles';

import {
  attachLocalUserRequestActions,
  buildLocalUserRequestDisplayLabels,
  filterLocalUserRequests,
  type LocalUserRequestActions,
  type LocalUserStatusFilterChip,
} from './localUserRequestStatusUi';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type RequestRow = LocalUserRequestListItem & { actions: LocalUserRequestActions };

const FILTER_CHIPS: readonly LocalUserStatusFilterChip[] = [
  'all',
  'pending',
  'confirmed',
  'active',
  'completed',
  'closed',
];

function formatTimestamp(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export function LocalUserRequestStatusScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { isLandscape, isTablet, isWeb } = useDeviceLayout();
  const useWideLayout = (isTablet || isWeb) && isLandscape;

  const [requests, setRequests] = useState<readonly RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<LocalUserStatusFilterChip>('all');
  const [actionRequestId, setActionRequestId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [timelineById, setTimelineById] = useState<
    Readonly<Record<string, readonly LocalUserRequestTimelineItem[]>>
  >({});
  const [timelineLoadingId, setTimelineLoadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isRestApiConfigured()) {
      setError(t('local.userRequestStatus.errorLoad'));
      setRequests([]);
      setLoading(false);
      return;
    }
    setError(null);
    const r = await fetchUserLocalServiceRequests();
    if (r.ok) {
      setRequests(r.data.requests.map((row) => attachLocalUserRequestActions(row)));
    } else {
      setError(r.error || t('local.userRequestStatus.errorLoad'));
      setRequests([]);
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
    () => filterLocalUserRequests(requests, activeFilter),
    [requests, activeFilter]
  );

  const loadTimeline = useCallback(
    async (requestId: string): Promise<void> => {
      if (timelineById[requestId]) {
        setExpandedId((prev) => (prev === requestId ? null : requestId));
        return;
      }
      setTimelineLoadingId(requestId);
      const r = await fetchUserLocalRequestTimeline(requestId);
      setTimelineLoadingId(null);
      if (r.ok) {
        setTimelineById((prev) => ({ ...prev, [requestId]: r.data.timeline }));
        setExpandedId(requestId);
        return;
      }
      Alert.alert(t('local.userRequestStatus.actionFailedTitle'), r.error);
    },
    [timelineById, t]
  );

  const cancelRequest = useCallback(
    (request: RequestRow) => {
      Alert.alert(
        t('local.userRequestStatus.cancelTitle'),
        t('local.userRequestStatus.cancelBody'),
        [
          { text: t('local.userRequestStatus.cancelDismiss'), style: 'cancel' },
          {
            text: t('local.userRequestStatus.cancelBtn'),
            style: 'destructive',
            onPress: () => {
              void (async () => {
                setActionRequestId(request.id);
                const r = await cancelUserLocalServiceRequest(request.id);
                setActionRequestId(null);
                if (r.ok) {
                  setExpandedId(null);
                  setTimelineById((prev) => {
                    const next = { ...prev };
                    delete next[request.id];
                    return next;
                  });
                  await load();
                  return;
                }
                Alert.alert(t('local.userRequestStatus.actionFailedTitle'), r.error);
              })();
            },
          },
        ]
      );
    },
    [load, t]
  );

  return (
    <SafeAreaView style={styles.container} className={applyWebStyles('kn-glass')}>
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
              accessibilityLabel={t('local.userRequestStatus.backA11y')}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
            </Pressable>
            <Text style={styles.title}>{t('local.userRequestStatus.title')}</Text>
          </View>

          <PrecisePanel style={styles.banner}>
            <Text style={styles.bannerText}>{t('local.userRequestStatus.safetyBanner')}</Text>
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
                    {t(`local.userRequestStatus.filter.${chip}`)}
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
                <Text style={styles.retryText}>{t('local.userRequestStatus.retry')}</Text>
              </Pressable>
            </PrecisePanel>
          ) : filtered.length === 0 ? (
            <PrecisePanel style={styles.emptyPanel}>
              <Ionicons name="documents-outline" size={28} color={theme.colors.SoftMineralGrey} />
              <Text style={styles.emptyText}>{t('local.userRequestStatus.empty')}</Text>
            </PrecisePanel>
          ) : (
            <View style={styles.list}>
              {filtered.map((request) => {
                const labels = buildLocalUserRequestDisplayLabels(request);
                const busy = actionRequestId === request.id;
                const expanded = expandedId === request.id;
                const timeline = timelineById[request.id];
                const timelineBusy = timelineLoadingId === request.id;
                const locationLine = [request.locationText, request.city]
                  .filter((v) => v != null && String(v).trim().length > 0)
                  .join(' · ');

                return (
                  <PrecisePanel
                    key={request.id}
                    style={[styles.card, webGlassStyle, webNeonGlowStyle, webHoverStyle]}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.serviceTitle} numberOfLines={2}>
                          {request.title}
                        </Text>
                        <Text style={styles.metaLine} numberOfLines={1}>
                          {request.business.name}
                        </Text>
                        {locationLine.length > 0 ? (
                          <Text style={styles.metaLine} numberOfLines={2}>
                            {locationLine}
                          </Text>
                        ) : null}
                        <Text style={styles.metaLine} numberOfLines={1}>
                          {formatTimestamp(request.requestedAt, i18n.language)}
                        </Text>
                      </View>
                      <View style={styles.badgeCol}>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{labels.statusLabel}</Text>
                        </View>
                        <View style={[styles.badge, styles.badgeMuted]}>
                          <Text style={styles.badgeTextMuted}>{labels.walletBadge}</Text>
                        </View>
                      </View>
                    </View>

                    {labels.showReviewPendingNote ? (
                      <Text style={styles.noteLine}>
                        {t('local.userRequestStatus.reviewPendingNote')}
                      </Text>
                    ) : null}
                    {labels.showConfirmedNote ? (
                      <Text style={styles.noteLine}>
                        {t('local.userRequestStatus.confirmedNote')}
                      </Text>
                    ) : null}
                    {labels.showCancelHint ? (
                      <Text style={styles.noteMuted}>
                        {t('local.userRequestStatus.cancelHint')}
                      </Text>
                    ) : null}

                    <View style={styles.actions}>
                      <Pressable
                        disabled={timelineBusy}
                        onPress={() => void loadTimeline(request.id)}
                        style={({ pressed }) => [
                          styles.secondaryBtn,
                          pressed && { opacity: 0.85 },
                          timelineBusy && styles.btnDisabled,
                        ]}
                      >
                        <Text style={styles.secondaryBtnText}>
                          {expanded
                            ? t('local.userRequestStatus.hideTimeline')
                            : t('local.userRequestStatus.showTimeline')}
                        </Text>
                      </Pressable>
                      {request.actions.canCancel ? (
                        <Pressable
                          disabled={busy}
                          onPress={() => cancelRequest(request)}
                          style={({ pressed }) => [
                            styles.cancelBtn,
                            pressed && { opacity: 0.85 },
                            busy && styles.btnDisabled,
                          ]}
                        >
                          <Text style={styles.cancelBtnText}>
                            {t('local.userRequestStatus.cancelBtn')}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>

                    {expanded && timeline ? (
                      <View style={styles.timelineBlock}>
                        <Text style={styles.timelineTitle}>
                          {t('local.userRequestStatus.timelineTitle')}
                        </Text>
                        {timeline.map((item) => (
                          <View key={`${item.type}-${item.at}`} style={styles.timelineRow}>
                            <Text style={styles.timelineItemTitle}>{item.title}</Text>
                            <Text style={styles.timelineItemMsg}>{item.message}</Text>
                            <Text style={styles.timelineItemAt}>
                              {formatTimestamp(item.at, i18n.language)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
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
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 14,
  },
  contentWide: {
    paddingHorizontal: 24,
    maxWidth: 960,
    alignSelf: 'center',
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  backBtn: {
    padding: 6,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.semibold,
    fontSize: 20,
    color: theme.colors.text.primary,
  },
  banner: {
    padding: 12,
    backgroundColor: 'rgba(122, 228, 255, 0.08)',
    borderColor: 'rgba(122, 228, 255, 0.25)',
  },
  bannerText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
    color: theme.colors.text.secondary,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(232, 237, 247, 0.18)',
    backgroundColor: 'rgba(15, 20, 32, 0.6)',
  },
  chipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(122, 228, 255, 0.12)',
  },
  chipText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  chipTextActive: {
    color: theme.colors.primary,
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyPanel: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 28,
  },
  emptyText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: '#FF8A8A',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(122, 228, 255, 0.15)',
  },
  retryText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: theme.colors.primary,
  },
  list: {
    gap: 12,
  },
  card: {
    padding: 14,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
    gap: 4,
  },
  serviceTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    color: theme.colors.text.primary,
  },
  metaLine: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  badgeCol: {
    gap: 6,
    maxWidth: 148,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(122, 228, 255, 0.14)',
  },
  badgeMuted: {
    backgroundColor: 'rgba(232, 237, 247, 0.08)',
  },
  badgeText: {
    fontFamily: FontFamily.medium,
    fontSize: 10,
    color: theme.colors.primary,
    textAlign: 'right',
  },
  badgeTextMuted: {
    fontFamily: FontFamily.regular,
    fontSize: 9,
    color: theme.colors.text.secondary,
    textAlign: 'right',
  },
  noteLine: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.secondary,
    lineHeight: 17,
  },
  noteMuted: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  secondaryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(232, 237, 247, 0.25)',
  },
  secondaryBtnText: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 138, 138, 0.45)',
    backgroundColor: 'rgba(255, 138, 138, 0.12)',
  },
  cancelBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#FF8A8A',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  timelineBlock: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(232, 237, 247, 0.12)',
    gap: 8,
  },
  timelineTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  timelineRow: {
    gap: 2,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(122, 228, 255, 0.35)',
  },
  timelineItemTitle: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: theme.colors.text.primary,
  },
  timelineItemMsg: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: theme.colors.text.secondary,
  },
  timelineItemAt: {
    fontFamily: FontFamily.regular,
    fontSize: 10,
    color: theme.colors.SoftMineralGrey,
  },
});
