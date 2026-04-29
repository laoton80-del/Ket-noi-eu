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
import { theme } from '../theme/theme';
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
      Alert.alert('Đã dọn bộ đệm TTS', 'Bộ đệm phát âm đã được xóa. Lần phát tiếp theo sẽ tạo lại theo phiên bản/TTL mới.');
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
        'Thống kê bộ đệm TTS',
        `Tổng entry: ${next.totalEntries}\n` +
          `Còn hạn: ${next.freshEntries}\n` +
          `Hết hạn: ${next.expiredEntries}\n` +
          `Lệch version: ${next.versionMismatchEntries}\n` +
          `Phiên bản hiện hành: ${next.activeVersion}\n` +
          `TTL (ngày): ${next.ttlDays}`
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
          <Text style={styles.toolsTitle}>Công cụ kiểm thử QA</Text>
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Bộ đệm TTS thời gian thực</Text>
              <Pressable
                onPress={() => void refreshStatsSilently()}
                style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.refreshBtnText}>Làm mới</Text>
              </Pressable>
            </View>
            <Text style={styles.statsLine}>Tổng entry: {stats?.totalEntries ?? '--'}</Text>
            <Text style={styles.statsLine}>Còn hạn: {stats?.freshEntries ?? '--'}</Text>
            <Text style={styles.statsLine}>Hết hạn: {stats?.expiredEntries ?? '--'}</Text>
            <Text style={styles.statsLine}>Lệch version: {stats?.versionMismatchEntries ?? '--'}</Text>
            <Text style={styles.statsLine}>Phiên bản hiện hành: {stats?.activeVersion ?? '--'}</Text>
            <Text style={styles.statsLine}>TTL (ngày): {stats?.ttlDays ?? '--'}</Text>
          </View>
          <View style={[styles.statsCard, { marginTop: 10 }]}>
            <View style={styles.statsHeader}>
              <Text style={styles.statsTitle}>Phân tích trọng yếu trước phát hành (cục bộ)</Text>
              <Pressable
                onPress={() => void refreshLaunchCriticalDebug()}
                disabled={loadingLaunchDebug}
                style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.8 }]}
              >
                <Text style={styles.refreshBtnText}>{loadingLaunchDebug ? '…' : 'Làm mới'}</Text>
              </Pressable>
            </View>
            <Text style={styles.statsLine}>{LAUNCH_DEBUG_EVENT_LIMIT} sự kiện gần nhất từ ảnh chụp tăng trưởng</Text>
            {launchDebugLines.length === 0 ? (
              <Text style={styles.launchDebugLine}>(chưa có sự kiện trọng yếu trước phát hành)</Text>
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
              pressed && { opacity: 0.8 },
            ]}
          >
            {readingStats ? (
              <View style={styles.clearBtnLoading}>
                <ActivityIndicator size="small" color={theme.colors.primaryBright} />
                <Text style={styles.statsBtnText}>Đang đọc thống kê bộ đệm...</Text>
              </View>
            ) : (
              <Text style={styles.statsBtnText}>Hiển thị thống kê bộ đệm TTS</Text>
            )}
          </Pressable>
          <Pressable
            onPress={() => void onClearTtsCache()}
            disabled={clearingCache}
            style={({ pressed }) => [
              styles.clearBtn,
              clearingCache && styles.clearBtnDisabled,
              pressed && { opacity: 0.8 },
            ]}
          >
            {clearingCache ? (
              <View style={styles.clearBtnLoading}>
                <ActivityIndicator size="small" color={theme.colors.DeepInkNavy} />
              <Text style={styles.clearBtnText}>Đang dọn bộ đệm TTS...</Text>
              </View>
            ) : (
              <Text style={styles.clearBtnText}>Xóa bộ đệm TTS</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.DeepInkNavy },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  title: {
    ...theme.typeScale.h1,
    color: theme.colors.primary,
    fontFamily: FontFamily.extrabold,
    marginBottom: 6,
  },
  subtitle: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginBottom: 12,
  },
  grid: { gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.panel,
    padding: 14,
    shadowColor: theme.colors.SignatureGold,
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
    ...theme.typeScale.caption,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.medium,
    marginBottom: 6,
  },
  cardValue: {
    ...theme.typeScale.h2,
    color: theme.colors.text.primary,
    fontFamily: FontFamily.extrabold,
    marginBottom: 2,
  },
  cardSub: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
  },
  // legacy shadow tuning kept for subtle depth on dark theme
  shadowLegacy: {
    shadowColor: theme.colors.glass.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
  toolsWrap: {
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.executive.panelMuted,
    padding: 12,
  },
  toolsTitle: {
    ...theme.typeScale.caption,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.semibold,
    marginBottom: 8,
  },
  statsCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.borderSoft,
    backgroundColor: theme.colors.executive.panel,
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
    ...theme.typeScale.caption,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.bold,
  },
  refreshBtn: {
    minHeight: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.hybrid.signalMutedBg,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnText: {
    ...theme.typeScale.caption,
    color: theme.colors.primaryBright,
    fontFamily: FontFamily.semibold,
  },
  statsLine: {
    ...theme.typeScale.caption,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.medium,
    marginBottom: 2,
  },
  launchDebugLine: {
    ...theme.typeScale.caption,
    lineHeight: 14,
    color: theme.colors.text.secondary,
    fontFamily: FontFamily.regular,
    marginTop: 4,
  },
  clearBtn: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  statsBtn: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.glass.border,
    backgroundColor: theme.hybrid.signalMutedBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  statsBtnText: {
    ...theme.typeScale.body,
    color: theme.colors.primaryBright,
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
    ...theme.typeScale.body,
    color: theme.colors.DeepInkNavy,
    fontFamily: FontFamily.bold,
  },
});
