import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState, type ReactElement } from 'react';
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

import {
  VionaRequestLiveDetailReadOnly,
  VionaRequestLiveListReadOnly,
} from '../../components/viona/requests';
import { vionaTrust } from '../../components/viona/vionaTrustTokens';
import type { RootStackParamList } from '../../navigation/routes';
import { isRestApiConfigured } from '../../services/apiClient';
import {
  fetchVionaRequestByIdReadOnly,
  fetchVionaRequestsReadOnly,
  type VionaRequestDetail,
  type VionaRequestListItem,
} from '../../services/vionaRequestReadOnlyApi';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function mapListLoadError(status: number, fallback: string): string {
  if (status === 401 || status === 403) {
    return 'Sign in required to view your read-only request inbox.';
  }
  return fallback;
}

function mapDetailLoadError(status: number, fallback: string): string {
  if (status === 401 || status === 403) {
    return 'Sign in required to view this request.';
  }
  if (status === 404) {
    return 'Request not found or not visible for your account.';
  }
  return fallback;
}

export function VionaRequestLiveInboxScreen(): ReactElement {
  const navigation = useNavigation<Nav>();

  const [requests, setRequests] = useState<readonly VionaRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VionaRequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailUnauthorized, setDetailUnauthorized] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadList = useCallback(async (): Promise<void> => {
    if (!isRestApiConfigured()) {
      setListError('REST API is not configured. Set EXPO_PUBLIC_REST_API_BASE to view requests.');
      setUnauthorized(false);
      setRequests([]);
      setLoading(false);
      return;
    }

    setListError(null);
    setUnauthorized(false);
    const result = await fetchVionaRequestsReadOnly({ limit: 50, skip: 0 });
    if (result.ok) {
      setRequests(result.data.requests);
      if (result.data.requests.length === 0) {
        setSelectedId(null);
        setDetail(null);
      }
    } else {
      const isAuthError = result.status === 401 || result.status === 403;
      setUnauthorized(isAuthError);
      setListError(
        mapListLoadError(result.status, result.error || 'Unable to load read-only request inbox.')
      );
      setRequests([]);
      setSelectedId(null);
      setDetail(null);
    }
    setLoading(false);
  }, []);

  const loadDetail = useCallback(async (requestId: string): Promise<boolean> => {
    setSelectedId(requestId);
    setDetailLoading(true);
    setDetailError(null);
    setDetailUnauthorized(false);
    setDetail(null);

    const result = await fetchVionaRequestByIdReadOnly(requestId);
    setDetailLoading(false);

    if (result.ok) {
      setDetail(result.data);
      return true;
    }

    const isAuthError = result.status === 401 || result.status === 403;
    setDetailUnauthorized(isAuthError);
    setDetailError(
      mapDetailLoadError(result.status, result.error || 'Unable to load read-only request detail.')
    );
    return false;
  }, []);

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await loadList();
    if (selectedId != null && !unauthorized) {
      await loadDetail(selectedId);
    }
    setRefreshing(false);
  }, [loadDetail, loadList, selectedId, unauthorized]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  return (
    <SafeAreaView style={styles.container} className={applyWebStyles('kn-glass')}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />
        }
      >
        <View style={styles.topRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]}
          >
            <Ionicons name="chevron-back" size={22} color={vionaTrust.ink} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={styles.title}>VIONA requests</Text>
            <Text style={styles.subtitle}>Read-only inbox · view requests · status display only</Text>
          </View>
        </View>

        <View style={styles.safetyBanner}>
          <Ionicons name="eye-outline" size={16} color={vionaTrust.inkMuted} />
          <Text style={styles.safetyText}>
            Read-only view wired to GET /api/viona/requests. Status is display-only — no send to
            review, approve, deny, assign, confirm, cancel, payment, booking, or SOS actions. Not
            production-ready.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={vionaTrust.ink} />
            <Text style={styles.hint}>Loading read-only inbox…</Text>
          </View>
        ) : unauthorized ? (
          <View style={styles.unauthorizedBox}>
            <Ionicons name="lock-closed-outline" size={20} color={vionaTrust.inkMuted} />
            <Text style={styles.unauthorizedTitle}>Sign in required</Text>
            <Text style={styles.unauthorizedText}>
              {listError ?? 'Sign in required to view your read-only request inbox.'}
            </Text>
          </View>
        ) : listError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{listError}</Text>
            <Pressable
              onPress={() => {
                setLoading(true);
                void loadList();
              }}
              accessibilityRole="button"
              accessibilityLabel="Retry loading inbox"
              style={({ pressed }) => [styles.retryBtn, pressed && { opacity: 0.88 }]}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your visible requests</Text>
            <VionaRequestLiveListReadOnly
              requests={requests}
              selectedId={selectedId}
              onSelect={(id) => void loadDetail(id)}
            />
            <Text style={styles.sectionTitle}>Read-only detail</Text>
            <View style={styles.detailPanel}>
              <VionaRequestLiveDetailReadOnly
                detail={detail}
                loading={detailLoading}
                unauthorized={detailUnauthorized}
                error={detailError}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
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
    color: vionaTrust.ink,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 11,
    color: vionaTrust.inkMuted,
    lineHeight: 15,
  },
  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    backgroundColor: vionaTrust.surfaceMuted,
  },
  safetyText: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 11,
    lineHeight: 15,
    color: vionaTrust.inkMuted,
  },
  sectionTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 12,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: vionaTrust.inkMuted,
  },
  centered: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: vionaTrust.inkMuted,
  },
  unauthorizedBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    backgroundColor: vionaTrust.surfaceMuted,
    alignItems: 'center',
    gap: 8,
  },
  unauthorizedTitle: {
    fontFamily: FontFamily.extrabold,
    fontSize: 14,
    color: vionaTrust.ink,
  },
  unauthorizedText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: vionaTrust.inkMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  errorBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(200, 75, 90, 0.35)',
    backgroundColor: 'rgba(200, 75, 90, 0.08)',
    gap: 10,
  },
  errorText: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    color: '#9f1239',
    textAlign: 'center',
  },
  retryBtn: {
    alignSelf: 'center',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  retryText: {
    fontFamily: FontFamily.extrabold,
    fontSize: 12,
    color: vionaTrust.ink,
  },
  detailPanel: {
    minHeight: 280,
    borderWidth: 1,
    borderColor: vionaTrust.border,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: vionaTrust.surface,
  },
});
