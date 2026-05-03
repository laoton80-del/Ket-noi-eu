import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CertificateGenerator } from '../../../components/academy/CertificateGenerator';
import { ShareAchievementButton } from '../../../components/academy/ShareAchievementButton';
import { useAuth } from '../../../context/AuthContext';
import { getLocalKidsRankingSnapshot, type KidsLeaderboardRow } from '../../../services/academy/LeaderboardService';
import { getMonthlyHallOfFameSnapshot, type MonthlyWinner } from '../../../services/academy/MonthlyRewardService';
import { FontFamily } from '../../../theme/typography';

type PodiumSlot = Readonly<{
  row: KidsLeaderboardRow;
  height: number;
  medalColor: string;
}>;

function childNicknameFromParent(parentName: string | undefined): string {
  const first = parentName?.trim().split(/\s+/)[0] ?? 'Bé nhà bạn';
  if (first.startsWith('Bé')) return first;
  return `Bé ${first}`;
}

export function KidsLeaderboardScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'weekly' | 'monthly'>('weekly');
  const [weeklyRows, setWeeklyRows] = useState<readonly KidsLeaderboardRow[]>([]);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyStale, setWeeklyStale] = useState(false);
  const [weeklyMeta, setWeeklyMeta] = useState<Readonly<{ periodKey: string; checksum: string }>>({
    periodKey: '',
    checksum: '',
  });
  const [monthlyWinners, setMonthlyWinners] = useState<readonly MonthlyWinner[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [monthlyStale, setMonthlyStale] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const parentChildNickname = childNicknameFromParent(user?.name);
  const city = weeklyRows[0]?.cityLabel ?? 'Global City';
  const meRow = useMemo(() => {
    const seed = (user?.phone ?? 'guest_parent').length;
    return {
      rank: 8 + (seed % 18),
      points: 900 - seed * 3,
    };
  }, [user?.phone]);

  const podium = useMemo<readonly PodiumSlot[]>(() => {
    const top = weeklyRows.slice(0, 3);
    return [
      { row: top[1] ?? top[0], height: 84, medalColor: '#D1D5DB' },
      { row: top[0], height: 112, medalColor: '#F59E0B' },
      { row: top[2] ?? top[0], height: 70, medalColor: '#B45309' },
    ];
  }, [weeklyRows]);

  useEffect(() => {
    let cancelled = false;
    setWeeklyLoading(true);
    void (async () => {
      const snapshot = await getLocalKidsRankingSnapshot(user?.country ?? 'DE');
      if (cancelled) return;
      setWeeklyRows(snapshot.rows);
      setWeeklyStale(snapshot.stale);
      setWeeklyMeta({ periodKey: snapshot.periodKey, checksum: snapshot.checksum });
      setWeeklyLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [retryNonce, user?.country]);

  useEffect(() => {
    let cancelled = false;
    setMonthlyLoading(true);
    void (async () => {
      const snapshot = await getMonthlyHallOfFameSnapshot(user?.country ?? 'DE');
      if (!cancelled) {
        setMonthlyWinners(snapshot.winners);
        setMonthlyStale(snapshot.stale);
        setMonthlyLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [retryNonce, user?.country]);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Bảng Vàng Danh Vọng</Text>
      <Text style={styles.subtitle}>Bảng xếp hạng giúp bố mẹ theo dõi hành trình giỏi tiếng Việt của bé</Text>

      <View style={styles.tabRow}>
        <Pressable
          style={({ pressed }) => [styles.tabBtn, tab === 'weekly' && styles.tabBtnActive, pressed && { opacity: 0.9 }]}
          onPress={() => setTab('weekly')}
        >
          <Text style={styles.tabText}>Bảng Vàng Tuần</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.tabBtn, tab === 'monthly' && styles.tabBtnActive, pressed && { opacity: 0.9 }]}
          onPress={() => setTab('monthly')}
        >
          <Text style={styles.tabText}>Bảng Vàng Tháng</Text>
        </Pressable>
      </View>
      {(weeklyStale || monthlyStale) && (
        <View style={styles.staleBanner}>
          <Text style={styles.staleText}>Dữ liệu đang ở chế độ dự phòng. Nhấn thử lại để cập nhật từ server.</Text>
          <Pressable style={styles.retryBtn} onPress={() => setRetryNonce((v) => v + 1)}>
            <Text style={styles.retryText}>Thử lại</Text>
          </Pressable>
        </View>
      )}

      {tab === 'weekly' ? (
        <>
          {weeklyLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.loadingText}>Đang tải bảng tuần...</Text>
            </View>
          ) : null}
          <View style={styles.podiumWrap}>
            {podium.map((slot, idx) => (
              <View key={`${slot.row.nickname}-${slot.row.rank}`} style={styles.podiumCol}>
                <View style={[styles.medal, { backgroundColor: slot.medalColor }]}>
                  <Ionicons name="trophy" size={18} color="#FFFFFF" />
                </View>
                <Text numberOfLines={1} style={styles.podiumName}>
                  {slot.row.avatarEmoji} {slot.row.nickname}
                </Text>
                <Text style={styles.podiumPoints}>{slot.row.vietKidsPoints}đ</Text>
                <View style={[styles.podiumBlock, { height: slot.height }]}>
                  <Text style={styles.podiumRank}>#{idx === 0 ? 2 : idx === 1 ? 1 : 3}</Text>
                </View>
              </View>
            ))}
          </View>

          <FlatList
            data={weeklyRows.slice(3, 50)}
            keyExtractor={(item) => `${item.rank}-${item.nickname}`}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.rowCard}>
                <Text style={styles.rowRank}>#{item.rank}</Text>
                <Text style={styles.rowName}>
                  {item.avatarEmoji} {item.nickname} - {item.cityLabel}
                </Text>
                <Text style={styles.rowPoints}>{item.vietKidsPoints}</Text>
              </View>
            )}
          />
          <Text style={styles.metaText}>Tuần: {weeklyMeta.periodKey} · chữ ký: {weeklyMeta.checksum}</Text>
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.monthlyContent}>
          {monthlyLoading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color="#2563EB" />
              <Text style={styles.loadingText}>Đang tải bảng tháng...</Text>
            </View>
          ) : null}
          {monthlyWinners.map((winner) => (
            <View key={`${winner.monthKey}-${winner.rank}-${winner.parentId}`} style={styles.monthlyCard}>
              <Text style={styles.monthlyBadge}>TOP {winner.rank}</Text>
              <CertificateGenerator winner={winner} />
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.stickyBar}>
        <View style={styles.stickyMain}>
          <Text style={styles.stickyText}>Bé nhà bạn đang ở Hạng {meRow.rank}! Cố lên!</Text>
          <Text style={styles.stickySub}>{meRow.points} điểm tuần này</Text>
        </View>
        <ShareAchievementButton
          childNickname={parentChildNickname}
          cityLabel={city}
          rank={meRow.rank}
          points={meRow.points}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECFEFF',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  title: { color: '#0C4A6E', fontSize: 30, fontFamily: FontFamily.extrabold, textAlign: 'center' },
  subtitle: { color: '#155E75', fontSize: 13, fontFamily: FontFamily.medium, textAlign: 'center', marginTop: 4 },
  tabRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 999,
    backgroundColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#2563EB',
  },
  tabText: { color: '#FFFFFF', fontSize: 12, fontFamily: FontFamily.bold },
  podiumWrap: {
    marginTop: 12,
    borderRadius: 20,
    backgroundColor: '#FDF4FF',
    borderWidth: 2,
    borderColor: '#E9D5FF',
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
  },
  podiumCol: { width: '31%', alignItems: 'center' },
  medal: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  podiumName: { color: '#4C1D95', fontSize: 12, fontFamily: FontFamily.bold, maxWidth: '98%' },
  podiumPoints: { color: '#6D28D9', fontSize: 11, fontFamily: FontFamily.medium, marginBottom: 5 },
  podiumBlock: {
    width: '82%',
    borderRadius: 10,
    backgroundColor: '#A78BFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  podiumRank: { color: '#FFFFFF', fontSize: 18, fontFamily: FontFamily.extrabold },
  listContent: { paddingTop: 10, paddingBottom: 104, gap: 8 },
  loadingWrap: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  loadingText: { color: '#0C4A6E', fontSize: 12, fontFamily: FontFamily.medium },
  staleBanner: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  staleText: { flex: 1, color: '#92400E', fontSize: 11, fontFamily: FontFamily.medium },
  retryBtn: { borderRadius: 999, backgroundColor: '#B45309', paddingVertical: 6, paddingHorizontal: 10 },
  retryText: { color: '#FFFFFF', fontSize: 11, fontFamily: FontFamily.bold },
  metaText: { textAlign: 'center', color: '#475569', fontSize: 11, fontFamily: FontFamily.medium, marginBottom: 100 },
  monthlyContent: { paddingTop: 12, paddingBottom: 110, gap: 10 },
  monthlyCard: {
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#FDE68A',
    backgroundColor: '#FEFCE8',
    padding: 8,
    gap: 6,
  },
  monthlyBadge: { color: '#92400E', fontSize: 12, fontFamily: FontFamily.extrabold, textAlign: 'center' },
  rowCard: {
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowRank: { width: 42, color: '#0C4A6E', fontSize: 13, fontFamily: FontFamily.bold },
  rowName: { flex: 1, color: '#334155', fontSize: 13, fontFamily: FontFamily.medium },
  rowPoints: { color: '#0369A1', fontSize: 13, fontFamily: FontFamily.bold },
  stickyBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 10,
    borderRadius: 16,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stickyMain: { flex: 1 },
  stickyText: { color: '#FFFFFF', fontSize: 13, fontFamily: FontFamily.bold },
  stickySub: { color: '#CBD5E1', fontSize: 12, fontFamily: FontFamily.medium, marginTop: 2 },
});
