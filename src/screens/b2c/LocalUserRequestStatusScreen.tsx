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
import { LocalUserRequestCreateComposer } from '../../components/local/LocalUserRequestCreateComposer';
import { LocalUserRequestStatusCard } from '../../components/local/LocalUserRequestStatusCard';
import { LocalConstellationFrame } from '../../components/local/LocalConstellationFrame';
import { localConstellation } from '../../components/local/localConstellationTokens';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import type { RootStackParamList } from '../../navigation/routes';
import { isRestApiConfigured } from '../../services/apiClient';
import {
  cancelUserLocalServiceRequest,
  fetchUserLocalRequestTimeline,
  fetchUserLocalServiceRequests,
  type LocalUserRequestCreateResult,
  type LocalUserRequestListItem,
  type LocalUserRequestTimelineItem,
} from '../../services/localUserRequestApi';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../utils/i18n';
import { applyWebStyles } from '../../utils/applyWebStyles';

import {
  findLikelyCreatedRequestId,
  type LocalCreateFormValues,
} from './localUserRequestCreateFlow';
import {
  attachLocalUserRequestActions,
  buildLocalUserRequestDisplayLabels,
  filterLocalUserRequests,
  localUserRequestStatusAccent,
  localUserRequestStatusHintKey,
  localUserRequestStatusIcon,
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

const SAFETY_PILLS = [
  { key: 'localCommerce.safety.pillRequestOnly', icon: 'paper-plane-outline' as const },
  { key: 'localCommerce.safety.pillNoPayment', icon: 'card-outline' as const },
  { key: 'localCommerce.safety.pillConfirmedNotPaid', icon: 'information-circle-outline' as const },
];

const INK = localConstellation.inkStrong;
const INK_MUTED = localConstellation.inkMuted;
const EMERALD = localConstellation.accentEmerald;

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

  const knownBusinesses = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of requests) {
      if (!map.has(row.businessId)) {
        map.set(row.businessId, row.business.name);
      }
    }
    return [...map.entries()].map(([id, name]) => ({ id, name }));
  }, [requests]);

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

  const handleCreated = useCallback(
    async (result: LocalUserRequestCreateResult) => {
      const refresh = await fetchUserLocalServiceRequests();
      if (!refresh.ok) {
        throw new Error('refresh_failed');
      }
      setRequests(refresh.data.requests.map((row) => attachLocalUserRequestActions(row)));
      setError(null);
      setExpandedId(result.id);
      setActiveFilter('all');
      void loadTimeline(result.id);
    },
    [loadTimeline]
  );

  const handleUnknownNetworkRefresh = useCallback(
    async (form: LocalCreateFormValues): Promise<string | null> => {
      const refresh = await fetchUserLocalServiceRequests();
      if (!refresh.ok) {
        return null;
      }
      const rows = refresh.data.requests.map((row) => attachLocalUserRequestActions(row));
      setRequests(rows);
      setError(null);
      const recoveredId = findLikelyCreatedRequestId({
        createdRequestId: null,
        listIds: rows.map((r) => r.id),
        title: form.title,
        businessId: form.businessId,
        candidates: rows.map((r) => ({
          id: r.id,
          title: r.title,
          businessId: r.businessId,
        })),
      });
      if (recoveredId) {
        setExpandedId(recoveredId);
        setActiveFilter('all');
        void loadTimeline(recoveredId);
      }
      return recoveredId;
    },
    [loadTimeline]
  );

  const handleAuthRequired = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

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
              colors={[EMERALD]}
              tintColor={EMERALD}
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
              <Ionicons name="chevron-back" size={22} color={INK} />
            </Pressable>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{t('local.userRequestStatus.title')}</Text>
              <Text style={styles.screenSubtitle} numberOfLines={2}>
                {t('local.userRequestStatus.screenSubtitle')}
              </Text>
            </View>
          </View>

          <LocalConstellationFrame accent="emerald" tier="hero" radius={16} contentStyle={styles.bannerInner}>
            <View style={styles.bannerHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color={EMERALD} accessibilityIgnoresInvertColors />
              <Text style={styles.bannerTitle}>{t('local.userRequestStatus.safetyStripTitle')}</Text>
            </View>
            <Text style={styles.bannerText} numberOfLines={3}>
              {t('local.userRequestStatus.safetyBanner')}
            </Text>
            <View style={styles.safetyPillRow}>
              {SAFETY_PILLS.map((pill) => (
                <View
                  key={pill.key}
                  style={styles.safetyPill}
                  accessibilityRole="text"
                  accessibilityLabel={t(pill.key)}
                >
                  <Ionicons name={pill.icon} size={12} color={EMERALD} accessibilityIgnoresInvertColors />
                  <Text style={styles.safetyPillText} numberOfLines={2}>
                    {t(pill.key)}
                  </Text>
                </View>
              ))}
            </View>
          </LocalConstellationFrame>

          <LocalUserRequestCreateComposer
            knownBusinesses={knownBusinesses}
            t={t}
            onCreated={handleCreated}
            onRefreshListForUnknownResult={handleUnknownNetworkRefresh}
            onAuthRequired={handleAuthRequired}
          />

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
                  accessibilityRole="button"
                  accessibilityLabel={t(`local.userRequestStatus.filter.${chip}`)}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && { opacity: 0.88 },
                  ]}
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
              <ActivityIndicator color={EMERALD} />
            </View>
          ) : error ? (
            <LocalConstellationFrame accent="cyan" tier="service" radius={16} contentStyle={styles.emptyInner}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                onPress={() => void load()}
                accessibilityRole="button"
                accessibilityLabel={t('local.userRequestStatus.retry')}
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.88 }]}
              >
                <Text style={styles.retryText}>{t('local.userRequestStatus.retry')}</Text>
              </Pressable>
            </LocalConstellationFrame>
          ) : filtered.length === 0 ? (
            <LocalConstellationFrame accent="emerald" tier="service" radius={16} contentStyle={styles.emptyInner}>
              <Ionicons name="documents-outline" size={28} color={EMERALD} accessibilityIgnoresInvertColors />
              <Text style={styles.emptyText}>{t('local.userRequestStatus.empty')}</Text>
            </LocalConstellationFrame>
          ) : (
            <View style={styles.list}>
              {filtered.map((request) => {
                const labels = buildLocalUserRequestDisplayLabels(request, t);
                const accent = localUserRequestStatusAccent(request.status);
                const hintKey = localUserRequestStatusHintKey(request.status);
                const busy = actionRequestId === request.id;
                const expanded = expandedId === request.id;
                const timeline = timelineById[request.id];
                const timelineBusy = timelineLoadingId === request.id;
                const locationLine = [request.locationText, request.city]
                  .filter((v) => v != null && String(v).trim().length > 0)
                  .join(' · ');

                return (
                  <LocalUserRequestStatusCard
                    key={request.id}
                    serviceTitle={request.title}
                    merchantLine={request.business.name}
                    locationLine={locationLine}
                    timeLine={formatTimestamp(request.requestedAt, i18n.language)}
                    accent={accent}
                    statusIcon={localUserRequestStatusIcon(request.status)}
                    labels={labels}
                    statusHint={hintKey ? t(hintKey) : null}
                    reviewPendingNote={t('local.userRequestStatus.reviewPendingNote')}
                    confirmedNote={t('local.userRequestStatus.confirmedNote')}
                    cancelHint={t('local.userRequestStatus.cancelHint')}
                    showTimelineLabel={t('local.userRequestStatus.showTimeline')}
                    hideTimelineLabel={t('local.userRequestStatus.hideTimeline')}
                    timelineTitle={t('local.userRequestStatus.timelineTitle')}
                    cancelBtnLabel={t('local.userRequestStatus.cancelBtn')}
                    expanded={expanded}
                    timelineBusy={timelineBusy}
                    actionBusy={busy}
                    canCancel={request.actions.canCancel}
                    timeline={timeline}
                    onToggleTimeline={() => void loadTimeline(request.id)}
                    onCancel={() => cancelRequest(request)}
                    formatTimelineAt={(iso) => formatTimestamp(iso, i18n.language)}
                  />
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
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 4,
  },
  backBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  title: {
    fontFamily: FontFamily.extrabold,
    fontSize: 18,
    color: INK,
    letterSpacing: -0.2,
  },
  screenSubtitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    color: INK_MUTED,
    lineHeight: 15,
  },
  bannerInner: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 12,
    fontFamily: FontFamily.extrabold,
    color: EMERALD,
    letterSpacing: 0.2,
  },
  bannerText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    lineHeight: 15,
    color: INK_MUTED,
  },
  safetyPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  safetyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexBasis: 120,
    flexGrow: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(72, 210, 165, 0.22)',
    backgroundColor: 'rgba(72, 210, 165, 0.06)',
  },
  safetyPillText: {
    flex: 1,
    fontSize: 9,
    fontFamily: FontFamily.extrabold,
    color: INK,
    lineHeight: 12,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: localConstellation.border,
    backgroundColor: 'rgba(10, 14, 22, 0.55)',
  },
  chipActive: {
    borderColor: 'rgba(72, 210, 165, 0.45)',
    backgroundColor: 'rgba(72, 210, 165, 0.1)',
  },
  chipText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 11,
    color: INK_MUTED,
    letterSpacing: 0.2,
  },
  chipTextActive: {
    color: EMERALD,
  },
  centered: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyInner: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 24,
    paddingHorizontal: 14,
  },
  emptyText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: INK_MUTED,
    textAlign: 'center',
    lineHeight: 16,
  },
  errorText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12,
    color: 'rgba(255, 138, 138, 0.95)',
    textAlign: 'center',
    lineHeight: 16,
  },
  retryBtn: {
    marginTop: 4,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(92, 205, 255, 0.28)',
    backgroundColor: 'rgba(92, 205, 255, 0.08)',
  },
  retryText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 11,
    color: localConstellation.accentCyan,
  },
  list: {
    gap: 12,
  },
});
