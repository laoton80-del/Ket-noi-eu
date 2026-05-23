import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useMemo, useState, type ReactElement } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LocalOpsAuditDetailPanel } from '../../components/local/ops/LocalOpsAuditDetailPanel';
import { LocalOpsAuditRequestCard } from '../../components/local/ops/LocalOpsAuditRequestCard';
import { LocalOpsAuditSafetyBanner } from '../../components/local/ops/LocalOpsAuditSafetyBanner';
import { LocalOpsAuditSafetyChips } from '../../components/local/ops/LocalOpsAuditSafetyChips';
import { AdaptiveContainer } from '../../components/layout/AdaptiveContainer';
import { useAuth } from '../../context/AuthContext';
import { useDeviceLayout } from '../../hooks/useDeviceLayout';
import type { RootStackParamList } from '../../navigation/routes';
import { isRestApiConfigured } from '../../services/apiClient';
import {
  fetchOpsLocalServiceRequestById,
  fetchOpsLocalServiceRequests,
  type LocalOpsRequestListItem,
} from '../../services/localOpsAuditApi';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { useTranslation } from '../../utils/i18n';

const PAGE_SIZE = 20;

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatTimestamp(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

export function LocalOpsAuditScreen(): ReactElement {
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { isLandscape, isTablet, isWeb } = useDeviceLayout();
  const useWideLayout = (isTablet || isWeb) && isLandscape;

  const [requests, setRequests] = useState<readonly LocalOpsRequestListItem[]>([]);
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LocalOpsRequestListItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const isAdmin = user?.serverRole === 'ADMIN';

  const formatTime = useCallback(
    (iso: string | null) => (iso ? formatTimestamp(iso, i18n.language) : '—'),
    [i18n.language]
  );

  const loadPage = useCallback(
    async (nextSkip: number, append: boolean) => {
      if (!isRestApiConfigured()) {
        setListError(t('local.opsAudit.error.apiNotConfigured'));
        setRequests([]);
        setHasMore(false);
        return false;
      }
      if (!isAdmin) {
        setListError(t('local.opsAudit.error.forbiddenRole'));
        setRequests([]);
        setHasMore(false);
        return false;
      }

      const r = await fetchOpsLocalServiceRequests({ limit: PAGE_SIZE, skip: nextSkip });
      if (!r.ok) {
        setListError(r.error || t('local.opsAudit.error.loadList'));
        if (!append) setRequests([]);
        setHasMore(false);
        return false;
      }

      setListError(null);
      const page = r.data.requests;
      setRequests((prev) => (append ? [...prev, ...page] : page));
      setHasMore(page.length >= PAGE_SIZE);
      setSkip(nextSkip + page.length);
      return true;
    },
    [isAdmin, t]
  );

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setSkip(0);
    setSelectedId(null);
    setDetail(null);
    setDetailError(null);
    await loadPage(0, false);
    setLoading(false);
  }, [loadPage]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  }, [loadInitial]);

  const onLoadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    await loadPage(skip, true);
    setLoadingMore(false);
  }, [hasMore, loadingMore, loadPage, skip]);

  const loadDetail = useCallback(
    async (requestId: string) => {
      setSelectedId(requestId);
      setDetailLoading(true);
      setDetailError(null);
      const cached = requests.find((r) => r.id === requestId);
      if (cached) {
        setDetail(cached);
      }

      const r = await fetchOpsLocalServiceRequestById(requestId);
      setDetailLoading(false);
      if (r.ok) {
        setDetail(r.data);
      } else {
        setDetailError(r.error || t('local.opsAudit.error.loadDetail'));
        if (!cached) setDetail(null);
      }
    },
    [requests, t]
  );

  const listPane = useMemo(() => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.primaryBright} />
          <Text style={styles.hint}>{t('local.opsAudit.loading')}</Text>
        </View>
      );
    }

    if (listError) {
      return (
        <View style={styles.centered}>
          <Text style={styles.error}>{listError}</Text>
          <Pressable onPress={() => void loadInitial()} style={styles.retryBtn}>
            <Text style={styles.retryText}>{t('local.opsAudit.retry')}</Text>
          </Pressable>
        </View>
      );
    }

    if (requests.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.hint}>{t('local.opsAudit.empty')}</Text>
        </View>
      );
    }

    return (
      <>
        {requests.map((item) => (
          <LocalOpsAuditRequestCard
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            formattedUpdatedAt={formatTime(item.updatedAt)}
            onPress={() => void loadDetail(item.id)}
          />
        ))}
        {hasMore ? (
          <Pressable
            onPress={() => void onLoadMore()}
            style={styles.loadMoreBtn}
            disabled={loadingMore}
            accessibilityRole="button"
          >
            {loadingMore ? (
              <ActivityIndicator color={theme.colors.primaryBright} size="small" />
            ) : (
              <Text style={styles.loadMoreText}>{t('local.opsAudit.loadMore')}</Text>
            )}
          </Pressable>
        ) : null}
      </>
    );
  }, [
    formatTime,
    hasMore,
    listError,
    loadDetail,
    loadInitial,
    loading,
    loadingMore,
    onLoadMore,
    requests,
    selectedId,
    t,
  ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <AdaptiveContainer>
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel={t('local.opsAudit.backA11y')}
          >
            <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
          </Pressable>
          <View style={styles.headerTextCol}>
            <Text style={styles.screenTitle}>{t('local.opsAudit.title')}</Text>
            <Text style={styles.screenSub}>{t('local.opsAudit.subtitle')}</Text>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
        >
          <LocalOpsAuditSafetyBanner />
          <LocalOpsAuditSafetyChips />

          <View style={[styles.panes, useWideLayout && styles.panesWide]}>
            <View style={[styles.listPane, useWideLayout && styles.listPaneWide]}>{listPane}</View>
            <View style={[styles.detailPane, useWideLayout && styles.detailPaneWide]}>
              <LocalOpsAuditDetailPanel
                item={detail}
                loading={detailLoading}
                error={detailError}
                formatTime={formatTime}
              />
            </View>
          </View>
        </ScrollView>
      </AdaptiveContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  backBtn: {
    padding: 6,
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  screenTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 18,
    color: theme.colors.text.primary,
  },
  screenSub: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    color: theme.colors.text.secondary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  panes: {
    gap: 14,
  },
  panesWide: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listPane: {
    gap: 10,
  },
  listPaneWide: {
    flex: 1,
    minWidth: 0,
  },
  detailPane: {
    minHeight: 240,
  },
  detailPaneWide: {
    flex: 1,
    minWidth: 0,
  },
  centered: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  error: {
    fontFamily: FontFamily.regular,
    fontSize: 14,
    color: theme.colors.danger,
    textAlign: 'center',
  },
  retryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primaryBright,
  },
  retryText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: theme.colors.primaryBright,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  loadMoreText: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    color: theme.colors.primaryBright,
  },
});
