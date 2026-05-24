import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdaptiveContainer } from '../../components/layout/AdaptiveContainer';
import { LocalMerchantRequestStatusCard } from '../../components/local/LocalMerchantRequestStatusCard';
import { LocalConstellationFrame } from '../../components/local/LocalConstellationFrame';
import { localConstellation } from '../../components/local/localConstellationTokens';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import type { RootStackParamList } from '../../navigation/routes';
import { isRestApiConfigured } from '../../services/apiClient';
import {
  confirmMerchantLocalServiceRequest,
  fetchMerchantLocalServiceRequests,
  rejectMerchantLocalServiceRequest,
  type LocalMerchantInboxRequest,
} from '../../services/localMerchantInboxApi';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../utils/i18n';
import { applyWebStyles } from '../../utils/applyWebStyles';

import {
  attachLocalInboxActions,
  buildLocalInboxDisplayLabels,
  filterLocalInboxRequests,
  localMerchantInboxStatusAccent,
  localMerchantInboxStatusHintKey,
  localMerchantInboxStatusIcon,
  type LocalInboxFilterChip,
} from './localMerchantInboxUi';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTER_CHIPS: readonly LocalInboxFilterChip[] = [
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

/** Expo web: multi-button Alert.alert does not reliably run confirm callbacks; use window.confirm. */
function confirmMerchantInboxAction(
  title: string,
  body: string,
  cancelLabel: string,
  confirmLabel: string,
  onConfirm: () => void,
  options?: Readonly<{ destructive?: boolean }>
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${body}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, body, [
    { text: cancelLabel, style: 'cancel' },
    {
      text: confirmLabel,
      style: options?.destructive ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}

export function LocalMerchantRequestInboxScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { isLandscape, isTablet, isWeb } = useDeviceLayout();
  const useWideLayout = (isTablet || isWeb) && isLandscape;

  const [requests, setRequests] = useState<readonly LocalMerchantInboxRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<LocalInboxFilterChip>('all');
  const [actionRequestId, setActionRequestId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isRestApiConfigured()) {
      setError(t('local.merchantInbox.errorLoad'));
      setRequests([]);
      setLoading(false);
      return;
    }
    setError(null);
    const r = await fetchMerchantLocalServiceRequests();
    if (r.ok) {
      setRequests(r.data.requests.map(attachLocalInboxActions));
    } else {
      setError(r.error || t('local.merchantInbox.errorLoad'));
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
    () => filterLocalInboxRequests(requests, activeFilter),
    [requests, activeFilter]
  );

  const runAction = useCallback(
    async (requestId: string, kind: 'confirm' | 'reject'): Promise<void> => {
      setActionRequestId(requestId);
      const call =
        kind === 'confirm'
          ? confirmMerchantLocalServiceRequest
          : rejectMerchantLocalServiceRequest;
      const r = await call(requestId);
      setActionRequestId(null);
      if (r.ok) {
        await load();
        return;
      }
      Alert.alert(t('local.merchantInbox.actionFailedTitle'), r.error);
    },
    [load, t]
  );

  const confirmAction = useCallback(
    (request: LocalMerchantInboxRequest) => {
      confirmMerchantInboxAction(
        t('local.merchantInbox.confirmTitle'),
        t('local.merchantInbox.confirmBody'),
        t('local.merchantInbox.cancelBtn'),
        t('local.merchantInbox.confirmBtn'),
        () => void runAction(request.id, 'confirm')
      );
    },
    [runAction, t]
  );

  const rejectAction = useCallback(
    (request: LocalMerchantInboxRequest) => {
      confirmMerchantInboxAction(
        t('local.merchantInbox.rejectTitle'),
        t('local.merchantInbox.rejectBody'),
        t('local.merchantInbox.cancelBtn'),
        t('local.merchantInbox.rejectBtn'),
        () => void runAction(request.id, 'reject'),
        { destructive: true }
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
              colors={[EMERALD]}
              tintColor={EMERALD}
            />
          }
        >
          <View style={styles.topRow}>
            <Pressable
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel={t('local.merchantInbox.backA11y')}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="chevron-back" size={22} color={INK} />
            </Pressable>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>{t('local.merchantInbox.title')}</Text>
              <Text style={styles.screenSubtitle} numberOfLines={2}>
                {t('local.merchantInbox.screenSubtitle')}
              </Text>
            </View>
          </View>

          <LocalConstellationFrame accent="emerald" tier="hero" radius={16} contentStyle={styles.bannerInner}>
            <View style={styles.bannerHeader}>
              <Ionicons name="shield-checkmark-outline" size={18} color={EMERALD} accessibilityIgnoresInvertColors />
              <Text style={styles.bannerTitle}>{t('local.merchantInbox.safetyStripTitle')}</Text>
            </View>
            <Text style={styles.bannerText} numberOfLines={3}>
              {t('local.merchantInbox.safetyBanner')}
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
                  accessibilityLabel={t(`local.merchantInbox.filter.${chip}`)}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && { opacity: 0.88 },
                  ]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {t(`local.merchantInbox.filter.${chip}`)}
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
                accessibilityLabel={t('local.merchantInbox.retry')}
                style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.88 }]}
              >
                <Text style={styles.retryText}>{t('local.merchantInbox.retry')}</Text>
              </Pressable>
            </LocalConstellationFrame>
          ) : filtered.length === 0 ? (
            <LocalConstellationFrame accent="emerald" tier="service" radius={16} contentStyle={styles.emptyInner}>
              <Ionicons name="document-text-outline" size={28} color={EMERALD} accessibilityIgnoresInvertColors />
              <Text style={styles.emptyText}>{t('local.merchantInbox.empty')}</Text>
            </LocalConstellationFrame>
          ) : (
            <View style={styles.list}>
              {filtered.map((request) => {
                const labels = buildLocalInboxDisplayLabels(request, t);
                const accent = localMerchantInboxStatusAccent(request.status);
                const hintKey = localMerchantInboxStatusHintKey(request.status);
                const busy = actionRequestId === request.id;
                const requesterName =
                  request.requester.displayName?.trim() ||
                  t('local.merchantInbox.requesterFallback');
                const locationLine = [request.locationText, request.city, request.countryCode]
                  .filter((v) => v != null && String(v).trim().length > 0)
                  .join(' · ');
                const descriptionLine =
                  request.description.trim().length > 0 ? request.description.trim() : null;

                return (
                  <LocalMerchantRequestStatusCard
                    key={request.id}
                    serviceTitle={request.title}
                    requesterLine={requesterName}
                    locationLine={locationLine}
                    timeLine={formatTimestamp(request.createdAt, i18n.language)}
                    descriptionLine={descriptionLine}
                    accent={accent}
                    statusIcon={localMerchantInboxStatusIcon(request.status)}
                    labels={labels}
                    statusHint={hintKey ? t(hintKey) : null}
                    reviewPendingNote={t('local.merchantInbox.reviewPendingNote')}
                    confirmedNote={t('local.merchantInbox.confirmedNote')}
                    confirmBtnLabel={t('local.merchantInbox.confirmBtn')}
                    rejectBtnLabel={t('local.merchantInbox.rejectBtn')}
                    actionBusy={busy}
                    canConfirm={request.actions.canConfirm}
                    canReject={request.actions.canReject}
                    onConfirm={() => confirmAction(request)}
                    onReject={() => rejectAction(request)}
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
