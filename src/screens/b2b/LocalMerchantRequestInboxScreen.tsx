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
  confirmMerchantLocalServiceRequest,
  fetchMerchantLocalServiceRequests,
  rejectMerchantLocalServiceRequest,
  type LocalMerchantInboxRequest,
} from '../../services/localMerchantInboxApi';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../utils/i18n';
import { applyWebStyles } from '../../utils/applyWebStyles';
import { webGlassStyle, webHoverStyle, webNeonGlowStyle } from '../../utils/webStyles';

import {
  attachLocalInboxActions,
  buildLocalInboxDisplayLabels,
  filterLocalInboxRequests,
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

function formatTimestamp(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
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
      Alert.alert(
        t('local.merchantInbox.confirmTitle'),
        t('local.merchantInbox.confirmBody'),
        [
          { text: t('local.merchantInbox.cancelBtn'), style: 'cancel' },
          {
            text: t('local.merchantInbox.confirmBtn'),
            onPress: () => void runAction(request.id, 'confirm'),
          },
        ]
      );
    },
    [runAction, t]
  );

  const rejectAction = useCallback(
    (request: LocalMerchantInboxRequest) => {
      Alert.alert(
        t('local.merchantInbox.rejectTitle'),
        t('local.merchantInbox.rejectBody'),
        [
          { text: t('local.merchantInbox.cancelBtn'), style: 'cancel' },
          {
            text: t('local.merchantInbox.rejectBtn'),
            style: 'destructive',
            onPress: () => void runAction(request.id, 'reject'),
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
              accessibilityLabel={t('local.merchantInbox.backA11y')}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name="chevron-back" size={22} color={theme.colors.text.primary} />
            </Pressable>
            <Text style={styles.title}>{t('local.merchantInbox.title')}</Text>
          </View>

          <PrecisePanel style={styles.banner}>
            <Text style={styles.bannerText}>{t('local.merchantInbox.safetyBanner')}</Text>
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
                    {t(`local.merchantInbox.filter.${chip}`)}
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
              <Ionicons name="document-text-outline" size={28} color={theme.colors.SoftMineralGrey} />
              <Text style={styles.emptyText}>{t('local.merchantInbox.empty')}</Text>
            </PrecisePanel>
          ) : (
            <View style={styles.list}>
              {filtered.map((request) => {
                const labels = buildLocalInboxDisplayLabels(request);
                const busy = actionRequestId === request.id;
                const requesterName =
                  request.requester.displayName?.trim() ||
                  t('local.merchantInbox.requesterFallback');
                const locationLine = [request.locationText, request.city, request.countryCode]
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
                          {requesterName}
                        </Text>
                        {locationLine.length > 0 ? (
                          <Text style={styles.metaLine} numberOfLines={2}>
                            {locationLine}
                          </Text>
                        ) : null}
                        <Text style={styles.metaLine} numberOfLines={1}>
                          {formatTimestamp(request.createdAt, i18n.language)}
                        </Text>
                        {request.description.trim().length > 0 ? (
                          <Text style={styles.descLine} numberOfLines={3}>
                            {request.description}
                          </Text>
                        ) : null}
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
                      <Text style={styles.noteLine}>{t('local.merchantInbox.reviewPendingNote')}</Text>
                    ) : null}
                    {labels.showConfirmedNote ? (
                      <Text style={styles.noteLine}>{t('local.merchantInbox.confirmedNote')}</Text>
                    ) : null}

                    <View style={styles.actions}>
                      {request.actions.canConfirm ? (
                        <Pressable
                          disabled={busy}
                          onPress={() => confirmAction(request)}
                          style={({ pressed }) => [
                            styles.confirmBtn,
                            pressed && { opacity: 0.85 },
                            busy && styles.btnDisabled,
                          ]}
                        >
                          <Text style={styles.confirmBtnText}>
                            {t('local.merchantInbox.confirmBtn')}
                          </Text>
                        </Pressable>
                      ) : null}
                      {request.actions.canReject ? (
                        <Pressable
                          disabled={busy}
                          onPress={() => rejectAction(request)}
                          style={({ pressed }) => [
                            styles.secondaryBtn,
                            pressed && { opacity: 0.85 },
                            busy && styles.btnDisabled,
                          ]}
                        >
                          <Text style={styles.secondaryBtnText}>
                            {t('local.merchantInbox.rejectBtn')}
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
  descLine: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.secondary,
    marginTop: 2,
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
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  confirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },
  confirmBtnText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    color: '#0B1020',
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
  btnDisabled: {
    opacity: 0.5,
  },
});
