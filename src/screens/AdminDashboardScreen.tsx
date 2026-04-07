import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { isAdminDebugSurfaceEnabled } from '../config/adminDebugGate';
import type { RootStackParamList } from '../navigation/routes';
import { getLastLaunchCriticalGrowthEventsForDebug } from '../services/growth/launchEvents';
import type { GrowthEvent } from '../services/growth/types';
import { clearTtsCache, getTtsCacheStats, type TtsCacheStats } from '../services/OpenAIService';
import { FontFamily } from '../theme/typography';

const LAUNCH_DEBUG_EVENT_LIMIT = 25;

function formatLaunchCriticalDebugLine(e: GrowthEvent): string {
  const parts = [
    new Date(e.at).toISOString(),
    e.name,
    e.value != null ? `value=${e.value}` : null,
    e.meta && Object.keys(e.meta).length > 0 ? `meta=${JSON.stringify(e.meta)}` : null,
  ].filter(Boolean) as string[];
  return parts.join('  ');
}

const MOCK_METRICS = [
  { id: 'inflow', label: 'Tổng Doanh Thu (Inflow)', value: 'USD 98,500', sub: '+12.4% tuần này (demo)' },
  { id: 'outflow', label: 'Chi phí API (Outflow)', value: 'USD 20,400', sub: 'Whisper / TTS / Vision (demo)' },
  { id: 'usage', label: 'Tổng Credits Tiêu Hao', value: '18,920 Credits', sub: 'Minh Khang CSKH' },
];

export function AdminDashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [clearingCache, setClearingCache] = useState(false);
  const [readingStats, setReadingStats] = useState(false);
  const [stats, setStats] = useState<TtsCacheStats | null>(null);
  const [launchDebugLines, setLaunchDebugLines] = useState<string[]>([]);
  const [loadingLaunchDebug, setLoadingLaunchDebug] = useState(false);

  useEffect(() => {
    if (!isAdminDebugSurfaceEnabled()) {
      navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }));
    }
  }, [navigation]);

  const onClearTtsCache = async () => {
    if (clearingCache) return;
    setClearingCache(true);
    try {
      await clearTtsCache();
      Alert.alert('Đã dọn TTS cache', 'Cache phát âm đã được xóa. Lần phát tiếp theo sẽ tạo lại theo version/TTL mới.');
    } catch {
      Alert.alert('Không thể dọn cache', 'Vui lòng thử lại sau.');
    } finally {
      setClearingCache(false);
    }
  };

  const onShowTtsCacheStats = async () => {
    if (readingStats) return;
    setReadingStats(true);
    try {
      const next = await getTtsCacheStats();
      setStats(next);
      Alert.alert(
        'TTS Cache Stats',
        `Tổng entry: ${next.totalEntries}\n` +
          `Fresh: ${next.freshEntries}\n` +
          `Expired: ${next.expiredEntries}\n` +
          `Lệch version: ${next.versionMismatchEntries}\n` +
          `Version active: ${next.activeVersion}\n` +
          `TTL (days): ${next.ttlDays}`
      );
    } catch {
      Alert.alert('Không thể đọc stats', 'Vui lòng thử lại sau.');
    } finally {
      setReadingStats(false);
    }
  };

  const refreshStatsSilently = async () => {
    try {
      const next = await getTtsCacheStats();
      setStats(next);
    } catch {
      // Ignore silent refresh errors.
    }
  };

  useEffect(() => {
    void refreshStatsSilently();
  }, []);

  const refreshLaunchCriticalDebug = useCallback(async () => {
    setLoadingLaunchDebug(true);
    try {
      const rows = await getLastLaunchCriticalGrowthEventsForDebug(LAUNCH_DEBUG_EVENT_LIMIT);
      setLaunchDebugLines(rows.map(formatLaunchCriticalDebugLine));
    } finally {
      setLoadingLaunchDebug(false);
    }
  }, []);

  useEffect(() => {
    void refreshLaunchCriticalDebug();
  }, [refreshLaunchCriticalDebug]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>SUPER ADMIN DASHBOARD</Text>
        <Text style={styles.subtitle}>Khu vực vận hành bí mật</Text>
        <View style={styles.grid}>
          <View style={[styles.card, styles.cardHero]}>
            <Text style={styles.cardLabel}>{MOCK_METRICS[0].label}</Text>
            <Text style={styles.cardValue}>{MOCK_METRICS[0].value}</Text>
            <Text style={styles.cardSub}>{MOCK_METRICS[0].sub}</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.card, styles.cardHalf]}>
              <Text style={styles.cardLabel}>{MOCK_METRICS[1].label}</Text>
              <Text style={styles.cardValue}>{MOCK_METRICS[1].value}</Text>
              <Text style={styles.cardSub}>{MOCK_METRICS[1].sub}</Text>
            </View>
            <View style={[styles.card, styles.cardHalf]}>
              <Text style={styles.cardLabel}>{MOCK_METRICS[2].label}</Text>
              <Text style={styles.cardValue}>{MOCK_METRICS[2].value}</Text>
              <Text style={styles.cardSub}>{MOCK_METRICS[2].sub}</Text>
            </View>
          </View>
        </View>
        <View style={styles.toolsWrap}>
          <Text style={styles.toolsTitle}>QA Debug Tools</Text>
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>TTS Cache Live</Text>
              <Pressable
                onPress={() => void refreshStatsSilently()}
                style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.refreshBtnText}>Refresh</Text>
              </Pressable>
            </View>
            <Text style={styles.statsLine}>Tổng entry: {stats?.totalEntries ?? '--'}</Text>
            <Text style={styles.statsLine}>Fresh: {stats?.freshEntries ?? '--'}</Text>
            <Text style={styles.statsLine}>Expired: {stats?.expiredEntries ?? '--'}</Text>
            <Text style={styles.statsLine}>Lệch version: {stats?.versionMismatchEntries ?? '--'}</Text>
            <Text style={styles.statsLine}>Version active: {stats?.activeVersion ?? '--'}</Text>
            <Text style={styles.statsLine}>TTL (days): {stats?.ttlDays ?? '--'}</Text>
          </View>
          <View style={[styles.statsCard, { marginTop: 10 }]}>
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Launch-critical analytics (local)</Text>
              <Pressable
                onPress={() => void refreshLaunchCriticalDebug()}
                disabled={loadingLaunchDebug}
                style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.85 }]}
              >
                <Text style={styles.refreshBtnText}>{loadingLaunchDebug ? '…' : 'Refresh'}</Text>
              </Pressable>
            </View>
            <Text style={styles.statsLine}>Last {LAUNCH_DEBUG_EVENT_LIMIT} events from growth snapshot</Text>
            {launchDebugLines.length === 0 ? (
              <Text style={styles.launchDebugLine}>(no launch-critical events yet)</Text>
            ) : (
              launchDebugLines.map((line, i) => (
                <Text key={`${i}-${line.slice(0, 24)}`} style={styles.launchDebugLine}>
                  {line}
                </Text>
              ))
            )}
          </View>
          <Pressable
            onPress={() => void onShowTtsCacheStats()}
            disabled={readingStats}
            style={({ pressed }) => [
              styles.statsBtn,
              readingStats && styles.clearBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            {readingStats ? (
              <View style={styles.clearBtnLoading}>
                <ActivityIndicator size="small" color="#FFEBD2" />
                <Text style={styles.statsBtnText}>Đang đọc cache stats...</Text>
              </View>
            ) : (
              <Text style={styles.statsBtnText}>Show TTS Cache Stats</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => void onClearTtsCache()}
            disabled={clearingCache}
            style={({ pressed }) => [
              styles.clearBtn,
              clearingCache && styles.clearBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
          >
            {clearingCache ? (
              <View style={styles.clearBtnLoading}>
                <ActivityIndicator size="small" color="#20160D" />
                <Text style={styles.clearBtnText}>Đang dọn TTS cache...</Text>
              </View>
            ) : (
              <Text style={styles.clearBtnText}>Clear TTS Cache</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#080808' },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  title: {
    fontSize: 28,
    color: '#E7C66D',
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(231,198,109,0.72)',
    fontFamily: FontFamily.regular,
    marginBottom: 12,
  },
  grid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(240, 215, 154, 0.55)',
    backgroundColor: 'rgba(16,16,16,0.94)',
    padding: 14,
    shadowColor: '#D8B86E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  cardHero: {
    minHeight: 132,
    justifyContent: 'center',
  },
  cardHalf: {
    flex: 1,
    minHeight: 148,
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 13,
    color: 'rgba(240, 215, 154, 0.9)',
    fontFamily: FontFamily.medium,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 24,
    color: '#FFF5D7',
    fontFamily: FontFamily.extrabold,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    color: 'rgba(240, 215, 154, 0.72)',
    fontFamily: FontFamily.regular,
  },
  // legacy shadow tuning kept for subtle depth on dark theme
  shadowLegacy: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  toolsWrap: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(240, 215, 154, 0.4)',
    backgroundColor: 'rgba(12,12,12,0.88)',
    padding: 12,
  },
  toolsTitle: {
    fontSize: 13,
    color: 'rgba(240, 215, 154, 0.9)',
    fontFamily: FontFamily.semibold,
    marginBottom: 8,
  },
  statsCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.28)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 10,
    marginBottom: 8,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statsTitle: {
    fontSize: 12,
    color: 'rgba(240, 215, 154, 0.95)',
    fontFamily: FontFamily.bold,
  },
  refreshBtn: {
    minHeight: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(240, 215, 154, 0.4)',
    backgroundColor: 'rgba(240, 215, 154, 0.12)',
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnText: {
    fontSize: 11,
    color: '#FFEBD2',
    fontFamily: FontFamily.semibold,
  },
  statsLine: {
    fontSize: 12,
    color: 'rgba(240, 215, 154, 0.86)',
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  launchDebugLine: {
    fontSize: 10,
    lineHeight: 14,
    color: 'rgba(240, 215, 154, 0.78)',
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  clearBtn: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.56)',
    backgroundColor: '#E7C66D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  statsBtn: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'rgba(231, 198, 109, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  statsBtnText: {
    fontSize: 13,
    color: '#FFEBD2',
    fontFamily: FontFamily.bold,
  },
  clearBtnDisabled: {
    opacity: 0.75,
  },
  clearBtnLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clearBtnText: {
    fontSize: 13,
    color: '#20160D',
    fontFamily: FontFamily.bold,
  },
});
