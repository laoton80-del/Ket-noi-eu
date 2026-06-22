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
  fetchVionaRequestById,
  fetchVionaRequests,
  type VionaRequestDetail,
  type VionaRequestListItem,
} from '../../services/vionaRequestApi';
import { theme } from '../../theme/theme';
import { FontFamily } from '../../theme/typography';
import { applyWebStyles } from '../../utils/applyWebStyles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function VionaRequestLiveInboxScreen(): ReactElement {
  const navigation = useNavigation<Nav>();

  const [requests, setRequests] = useState<readonly VionaRequestListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VionaRequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadList = useCallback(async (): Promise<void> => {
    if (!isRestApiConfigured()) {
      setListError('REST API is not configured. Set EXPO_PUBLIC_REST_API_BASE for live read-only inbox.');
      setRequests([]);
      setLoading(false);
      return;
    }

    setListError(null);
    const result = await fetchVionaRequests({ limit: 50, skip: 0 });
    if (result.ok) {
      setRequests(result.data.requests);
      if (result.data.requests.length === 0) {
        setSelectedId(null);
        setDetail(null);
      }
    } else {
      setListError(result.error || 'Unable to load read-only request inbox.');
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
    setDetail(null);

    const result = await fetchVionaRequestById(requestId);
    setDetailLoading(false);

    if (result.ok) {
      setDetail(result.data);
      return true;
    }

    setDetailError(result.error || 'Unable to load read-only request detail.');
    return false;
  }, []);

  const refreshDetailAfterNote = useCallback(async (): Promise<boolean> => {
    if (selectedId == null) {
      return false;
    }
    const result = await fetchVionaRequestById(selectedId);
    if (result.ok) {
      setDetail(result.data);
      setDetailError(null);
      return true;
    }
    setDetailError(result.error || 'Unable to refresh request detail.');
    return false;
  }, [selectedId]);

  const onRefresh = useCallback(async (): Promise<void> => {
    setRefreshing(true);
    await loadList();
    if (selectedId != null) {
      await loadDetail(selectedId);
    }
    setRefreshing(false);
  }, [loadDetail, loadList, selectedId]);

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
            <Text style={styles.subtitle}>Live inbox · Pack16 GET · note submit (Pack24)</Text>
          </View>
        </View>

        <View style={styles.safetyBanner}>
          <Ionicons name="eye-outline" size={16} color={vionaTrust.inkMuted} />
          <Text style={styles.safetyText}>
            Read-only preview wired to GET /api/viona/requests. Note submit uses verified Pack20
            note action only. Not production-ready. No payment, booking, SOS dispatch, or other
            live actions.
          </Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={vionaTrust.ink} />
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
                error={detailError}
                onNoteSubmitted={refreshDetailAfterNote}
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
